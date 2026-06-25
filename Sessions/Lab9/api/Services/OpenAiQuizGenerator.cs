using System.ClientModel;
using System.Text.Json;
using OpenAI;
using OpenAI.Chat;

namespace Lab7.Services;

// NEW for Lab 9 — a plain backend service: build a prompt, call the model,
// get JSON back, deserialize it, check it before trusting it. No framework
// in between — just a chat client and a contract we verify ourselves.
//
// Free-tier model access via GitHub Models — the same GITHUB_TOKEN you've
// used since Lab 1. Get one (with the "models" scope) at
// https://github.com/settings/tokens if you don't have it set already.
public class OpenAiQuizGenerator : IQuizGenerator
{
    private const string Instructions =
        "You turn source text into a multiple-choice quiz. Read the supplied text " +
        "carefully and write clear, self-contained questions that can be answered " +
        "from the text alone — never invent facts that aren't in it. Every question " +
        "needs exactly four answer options, with exactly one isCorrect = true. Keep " +
        "question and option text concise. Respond with JSON only, matching the " +
        "supplied schema.";

    // The JSON shape we force the model to respond in (a "structured output"
    // request) — it still has to be checked once it comes back, same as any
    // other input from outside this process. See the validation loop below.
    private static readonly BinaryData ResponseSchema = BinaryData.FromBytes("""
        {
          "type": "object",
          "properties": {
            "questions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "text": { "type": "string" },
                  "options": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "text": { "type": "string" },
                        "isCorrect": { "type": "boolean" }
                      },
                      "required": ["text", "isCorrect"],
                      "additionalProperties": false
                    }
                  }
                },
                "required": ["text", "options"],
                "additionalProperties": false
              }
            }
          },
          "required": ["questions"],
          "additionalProperties": false
        }
        """u8.ToArray());

    private readonly ChatClient _chatClient;

    public OpenAiQuizGenerator()
    {
        var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
            ?? throw new InvalidOperationException(
                "Set the GITHUB_TOKEN environment variable to a GitHub personal access " +
                "token with the 'models' scope (the same token from Lab 1-4) before " +
                "calling POST /quizzes/generate.");

        var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

        var client = new OpenAIClient(
            new ApiKeyCredential(token),
            new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

        _chatClient = client.GetChatClient(modelId);
    }

    public async Task<GeneratedQuizPayload> GenerateAsync(
        string sourceText, int questionCount, CancellationToken cancellationToken = default)
    {
        var prompt =
            $"Source text:\n\"\"\"\n{sourceText}\n\"\"\"\n\n" +
            $"Write exactly {questionCount} multiple-choice questions based only on the source text above.";

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(Instructions),
            new UserChatMessage(prompt),
        };

        var options = new ChatCompletionOptions
        {
            ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                jsonSchemaFormatName: "quiz",
                jsonSchema: ResponseSchema,
                jsonSchemaIsStrict: true),
        };

        var completion = await _chatClient.CompleteChatAsync(messages, options, cancellationToken);
        var json = completion.Value.Content[0].Text;

        var payload = JsonSerializer.Deserialize<GeneratedQuizPayload>(
            json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        // The model gave us JSON in the shape we asked for — that's not the
        // same as the JSON being *right*. Check it before persisting any of
        // it, exactly like every other shape we don't control (the question
        // options a client posts, the answers it submits for grading, etc.).
        if (payload is null || payload.Questions.Count == 0)
            throw new InvalidOperationException("The model did not return any questions.");

        foreach (var q in payload.Questions)
        {
            if (q.Options.Count < 2 || q.Options.Count(o => o.IsCorrect) != 1)
                throw new InvalidOperationException(
                    $"The model returned a malformed question (\"{q.Text}\"): " +
                    "needs 2+ options and exactly one marked correct.");
        }

        return payload;
    }
}
