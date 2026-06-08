using System.ComponentModel;
using Lab6.Models;
using Lab6.Repositories;
using ModelContextProtocol.Server;

namespace Lab6.Mcp;

[McpServerToolType]
public class QuizTools
{
    [McpServerTool(Name = "list_quizzes")]
    [Description("List all quizzes, including their questions.")]
    public static async Task<IEnumerable<Quiz>> ListQuizzes(IQuizRepository repo) =>
        await repo.AllAsync();

    [McpServerTool(Name = "get_quiz")]
    [Description("Get a single quiz by its id, including its questions.")]
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
    [Description("Add a question to an existing quiz. Returns the updated quiz, or null if it does not exist.")]
    public static async Task<Quiz?> AddQuestion(
        IQuizRepository repo,
        [Description("The id (GUID) of the quiz.")] Guid quizId,
        [Description("The question text.")] string text) =>
        await repo.AddQuestionAsync(quizId, text);
}