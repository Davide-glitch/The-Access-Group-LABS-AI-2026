using Lab7.Models;

namespace Lab7.Repositories;

public interface IQuizRepository
{
    Task<IEnumerable<Quiz>> AllAsync();
    Task<Quiz?>             FindAsync(Guid id);
    Task<Quiz>              AddAsync(string title, string? description, string ownerId);
    Task<bool>             UpdateAsync(Guid id, string title, string? description);
    Task<bool>             RemoveAsync(Guid id);

    // Adds a question to an existing quiz, with zero or more answer options.
    // Returns the quiz, or null if it doesn't exist. Used by both the manual
    // QuizBuilder flow and the AI-generation flow — same call, same rules.
    Task<Quiz?>            AddQuestionAsync(Guid quizId, string text, List<(string Text, bool IsCorrect)> options);
}
