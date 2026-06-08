using System.ComponentModel;
using Lab6.Models;
using Lab6.Repositories;
using ModelContextProtocol.Server;

namespace Lab6.Mcp;

/// <summary>
/// Exposes the Quizzes operations as MCP tools. Each tool injects the same
/// IQuizRepository the controller uses, so the AI agent and the REST API
/// share one storage path. The MCP SDK invokes each tool inside a DI scope,
/// so the scoped repository (and its DbContext) resolve correctly per call.
/// </summary>
[McpServerToolType]
public class QuizTools
{
    [McpServerTool(Name = "list_quizzes")]
    [Description("List all quizzes, including their questions.")]
    public static async Task<IEnumerable<Quiz>> ListQuizzes(IQuizRepository repo) =>
        await repo.AllAsync();

    [McpServerTool(Name = "get_quiz")]
    [Description("Get a single quiz by its id, including its questions. Returns null if not found.")]
    public static async Task<Quiz?> GetQuiz(
        IQuizRepository repo,
        [Description("The quiz id (GUID).")] Guid id) =>
        await repo.FindAsync(id);

    [McpServerTool(Name = "create_quiz")]
    [Description("Create a new quiz. Returns the created quiz with its generated id.")]
    public static async Task<Quiz> CreateQuiz(
        IQuizRepository repo,
        [Description("The quiz title.")] string title,
        [Description("Optional quiz description.")] string? description = null) =>
        await repo.AddAsync(title, description);

    [McpServerTool(Name = "add_question")]
    [Description("Add a question to an existing quiz. Returns the updated quiz, or null if the quiz does not exist.")]
    public static async Task<Quiz?> AddQuestion(
        IQuizRepository repo,
        [Description("The id (GUID) of the quiz to add the question to.")] Guid quizId,
        [Description("The question text.")] string text) =>
        await repo.AddQuestionAsync(quizId, text);
}
