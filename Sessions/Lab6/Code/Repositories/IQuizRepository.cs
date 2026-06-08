using Lab6.Models;

namespace Lab6.Repositories;

public interface IQuizRepository
{
    Task<IEnumerable<Quiz>> AllAsync(string? tag = null);
    Task<Quiz?> FindAsync(Guid id);
    Task<Quiz> AddAsync(string title, string? description);
    Task<bool> UpdateAsync(Guid id, string title, string? description);
    Task<bool> RemoveAsync(Guid id);

    Task<Quiz?> AddQuestionAsync(Guid quizId, string text);

    Task<Quiz?> AddTagAsync(Guid quizId, string tagName);
}