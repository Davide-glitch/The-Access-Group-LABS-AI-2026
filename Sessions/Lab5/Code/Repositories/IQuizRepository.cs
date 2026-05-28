using Lab5.Models;

namespace Lab5.Repositories;

public interface IQuizRepository
{
    IEnumerable<Quiz> All();
    Quiz? Find(Guid id);
    Quiz Add(string title, string? description);
    bool Update(Guid id, string title, string? description);
    bool Remove(Guid id);
}