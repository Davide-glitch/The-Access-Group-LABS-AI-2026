using System.ClientModel;
using System.ComponentModel;
using Lab7.Repositories;
using Microsoft.Extensions.AI;
using OpenAI;

namespace Lab7.Services;

// NEW for Lab 10 — this is now an agent, not a one-shot completion call. It
// has two tools: one that reads real data (list_existing_quiz_titles) and
// one that IS the final answer (create_quiz). The model decides when to call
// each; Microsoft.Extensions.AI's function-invocation middleware handles the
// tool_call -> execute -> feed-result-back loop, so this class doesn't write
// that loop by hand.
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
        "question and option text concise.\n\n" +
        "Before writing questions, call list_existing_quiz_titles to see what quizzes " +
        "already exist, and pick a title and angle that doesn't duplicate one of them. " +
        "When you're confident the questions are accurate and non-duplicate, call " +
        "create_quiz exactly once with the finished quiz — that call IS your final " +
        "answer, don't also repeat the quiz back as plain text.";

    private readonly IChatClient _chatClient;
    private readonly IQuizRepository _repo;

    // Scoped per request (see Program.cs) — safe to stash the in-progress
    // result here, the same way _repo below is a per-request dependency too.
    private GeneratedQuizPayload? _result;

    public OpenAiQuizGenerator(IQuizRepository repo)
    {
        _repo = repo;

        var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
            ?? throw new InvalidOperationException(
                "Set the GITHUB_TOKEN environment variable to a GitHub personal access " +
                "token with the 'models' scope (the same token from Lab 1-4) before " +
                "calling POST /quizzes/generate.");

        var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

        var openAiClient = new OpenAIClient(
            new ApiKeyCredential(token),
            new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

        // Wrap the plain OpenAI chat client in Microsoft.Extensions.AI's
        // IChatClient abstraction, then layer on function-invocation
        // middleware: it's what turns "the model asked for a tool call"
        // into "the tool actually ran and the model saw the result."
        _chatClient = openAiClient
            .GetChatClient(modelId)
            .AsIChatClient()
            .AsBuilder()
            .UseFunctionInvocation()
            .Build();
    }

    public async Task<GeneratedQuizPayload> GenerateAsync(
        string sourceText, int questionCount, CancellationToken cancellationToken = default)
    {
        _result = null;

        var chatOptions = new ChatOptions
        {
            Tools =
            [
                AIFunctionFactory.Create(ListExistingQuizTitlesAsync),
                AIFunctionFactory.Create(CreateQuiz),
            ],
        };

        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, Instructions),
            new(ChatRole.User,
                $"Source text:\n\"\"\"\n{sourceText}\n\"\"\"\n\n" +
                $"Write exactly {questionCount} multiple-choice questions based only on the source text above."),
        };

        await _chatClient.GetResponseAsync(messages, chatOptions, cancellationToken);

        // create_quiz already validated its own arguments before setting
        // _result (see below) — same "check it before trusting it" rule
        // Lab 9 applied to the plain structured-output response. If the
        // model never called it, there's nothing to return.
        return _result ?? throw new InvalidOperationException(
            "The model finished without calling create_quiz.");
    }

    [Description("Returns the title and description of every existing quiz — call " +
                 "this before writing questions, so you can avoid duplicating an " +
                 "existing quiz's topic.")]
    private async Task<IEnumerable<object>> ListExistingQuizTitlesAsync()
    {
        var quizzes = await _repo.AllAsync();
        return quizzes.Select(q => new { q.Title, q.Description });
    }

    [Description("Submit the finished quiz. Call this exactly once, when you're " +
                 "confident the questions are accurate and non-duplicate.")]
    private string CreateQuiz(
        [Description("The quiz questions. Each needs 2+ answer options with exactly one isCorrect = true.")]
        List<GeneratedQuestionPayload> questions)
    {
        var payload = new GeneratedQuizPayload { Questions = questions };

        // Thrown exceptions here are caught by the function-invocation
        // middleware and fed back to the model as the tool's result, so a
        // malformed first attempt becomes a self-correction opportunity
        // instead of a hard failure — the model sees the error and can call
        // create_quiz again. GenerateAsync only throws if it never converges.
        if (payload.Questions.Count == 0)
            throw new InvalidOperationException("A quiz needs at least one question.");

        foreach (var q in payload.Questions)
        {
            if (q.Options.Count < 2 || q.Options.Count(o => o.IsCorrect) != 1)
                throw new InvalidOperationException(
                    $"Malformed question (\"{q.Text}\"): needs 2+ options and exactly one marked correct.");
        }

        _result = payload;
        return "Quiz recorded.";
    }
}
