using Lab7.Models;

namespace Lab7.Repositories;

public interface IQuizRepository
{
    Task<IEnumerable<Quiz>> AllAsync();
    Task<Quiz?>             FindAsync(Guid id);
    Task<Quiz>              AddAsync(string title, string? description, string ownerId);
    Task<bool>             UpdateAsync(Guid id, string title, string? description);
    Task<bool>             RemoveAsync(Guid id);

    // Adds a question to an existing quiz. Returns the quiz, or null if it doesn't exist.
    Task<Quiz?>            AddQuestionAsync(Guid quizId, string text);
}
