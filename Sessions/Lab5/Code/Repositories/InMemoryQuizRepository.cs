using System.Collections.Concurrent;
using Lab5.Models;

namespace Lab5.Repositories;

public class InMemoryQuizRepository : IQuizRepository
{
    private readonly ConcurrentDictionary<Guid, Quiz> _store = new();

    public InMemoryQuizRepository()
    {
        // Seed some initial data so the API is not empty
        Add("C# fundamentals", "Variables, types, control flow, methods.");
        Add("HTTP basics", "Verbs, status codes, headers.");
        Add("REST principles", "Resources, idempotency, anti-patterns.");
    }

    public IEnumerable<Quiz> All() => _store.Values.OrderBy(q => q.CreatedAt);

    public Quiz? Find(Guid id) =>
        _store.TryGetValue(id, out var q) ? q : null;

    public Quiz Add(string title, string? description)
    {
        var quiz = new Quiz { Title = title, Description = description };
        _store[quiz.Id] = quiz;
        return quiz;
    }

    public bool Update(Guid id, string title, string? description)
    {
        if (!_store.TryGetValue(id, out var existing)) return false;

        existing.Title = title;
        existing.Description = description;
        return true;
    }

    public bool Remove(Guid id) => _store.TryRemove(id, out _);
}