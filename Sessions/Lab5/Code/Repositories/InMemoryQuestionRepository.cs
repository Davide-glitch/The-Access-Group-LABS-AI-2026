using System.Collections.Concurrent;
using Lab5.Models;

namespace Lab5.Repositories;

public class InMemoryQuestionRepository : IQuestionRepository
{
    private readonly ConcurrentDictionary<Guid, Question> _store = new();

    public IEnumerable<Question> GetByQuizId(Guid quizId)
    {
        return _store.Values
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.CreatedAt);
    }

    public Question? Find(Guid id) =>
        _store.TryGetValue(id, out var q) ? q : null;

    public Question Add(Guid quizId, string text, string correctAnswer)
    {
        var question = new Question
        {
            QuizId = quizId,
            Text = text,
            CorrectAnswer = correctAnswer
        };
        _store[question.Id] = question;
        return question;
    }

    public bool Update(Guid id, string text, string correctAnswer)
    {
        if (!_store.TryGetValue(id, out var existing)) return false;

        existing.Text = text;
        existing.CorrectAnswer = correctAnswer;
        return true;
    }

    public bool Remove(Guid id) => _store.TryRemove(id, out _);

    public void RemoveAllByQuizId(Guid quizId)
    {
        var toRemove = _store.Values.Where(q => q.QuizId == quizId).Select(q => q.Id).ToList();
        foreach (var id in toRemove)
        {
            _store.TryRemove(id, out _);
        }
    }
}