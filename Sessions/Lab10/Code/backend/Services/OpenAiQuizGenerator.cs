using System.ClientModel;
using System.ComponentModel;
using Lab7.Repositories;
using Microsoft.Extensions.AI;
using OpenAI;

namespace Lab7.Services;

public class OpenAiQuizGenerator : IQuizGenerator
{
    private readonly IChatClient _chatClient;
    private readonly IQuizRepository _repo;
    private GeneratedQuizPayload? _result;

    public OpenAiQuizGenerator(IQuizRepository repo)
    {
        _repo = repo;

        var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
            ?? throw new InvalidOperationException("Set GITHUB_TOKEN before calling /quizzes/generate.");

        var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

        var openAiClient = new OpenAIClient(
            new ApiKeyCredential(token),
            new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

        _chatClient = openAiClient
            .GetChatClient(modelId)
            .AsIChatClient()
            .AsBuilder()
            .UseFunctionInvocation()
            .Build();
    }

    [Description("Returns the title and description of every existing quiz — call " +
                 "this before writing questions, so you can avoid duplicating an " +
                 "existing quiz's topic.")]
    private async Task<IEnumerable<object>> ListExistingQuizTitlesAsync()
    {
        var quizzes = await _repo.AllAsync();
        return quizzes.Select(q => new { q.Title, q.Description });
    }

    [Description("Analyzes the source text to determine its approximate length and reading level. Call this to gauge the complexity of the text.")]
    private string AnalyzeTextDifficulty([Description("The source text to analyze")] string text)
    {
        int wordCount = text.Split(new[] { ' ', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Length;
        string level = wordCount > 100 ? "Advanced" : "Basic";
        return $"Text length is {wordCount} words. Suggested difficulty is {level}. Adjust questions accordingly.";
    }

    [Description("Submit the finished quiz. Call this exactly once, when you're " +
                 "confident the questions are accurate and non-duplicate.")]
    private string CreateQuiz(
        [Description("The quiz questions. Each needs 2+ answer options with exactly one isCorrect = true.")]
        List<GeneratedQuestionPayload> questions)
    {
        var payload = new GeneratedQuizPayload { Questions = questions };

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

    private const string Instructions =
        "You turn source text into a multiple-choice quiz. Read the supplied text " +
        "carefully and write clear, self-contained questions that can be answered " +
        "from the text alone — never invent facts that aren't in it. Every question " +
        "needs exactly four answer options, with exactly one isCorrect = true. Keep " +
        "question and option text concise.\n\n" +
        "Before writing questions, call list_existing_quiz_titles to see what quizzes " +
        "already exist, and pick a title and angle that doesn't duplicate one of them. " +
        "Call AnalyzeTextDifficulty to understand the source material's complexity.\n" +
        "When you're confident the questions are accurate and non-duplicate, call " +
        "create_quiz exactly once with the finished quiz — that call IS your final " +
        "answer, don't also repeat the quiz back as plain text.";

    public async Task<GeneratedQuizPayload> GenerateAsync(
        string sourceText, int questionCount, CancellationToken cancellationToken = default)
    {
        _result = null;

        var chatOptions = new ChatOptions
        {
            Tools =
            [
                AIFunctionFactory.Create(ListExistingQuizTitlesAsync),
                AIFunctionFactory.Create(AnalyzeTextDifficulty),
                AIFunctionFactory.Create(CreateQuiz),
            ],
        };

        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, Instructions),
            new(ChatRole.User,
                $"Source text:\n\"\"\"\n{sourceText}\n\"\"\"\n\n" +
                $"Write exactly {questionCount} multiple-choice questions based only on the source text above.")
        };

        await _chatClient.GetResponseAsync(messages, chatOptions, cancellationToken);

        return _result ?? throw new InvalidOperationException(
            "The model finished without calling create_quiz.");
    }
}