using Lab7.Data;
using Lab7.Models;
using Microsoft.EntityFrameworkCore;

namespace Lab7.Repositories;

public class EfQuizRepository : IQuizRepository
{
    private readonly QuizzesDbContext _db;

    public EfQuizRepository(QuizzesDbContext db) => _db = db;

    public async Task<IEnumerable<Quiz>> AllAsync() =>
        await _db.Quizzes
                 .Include(q => q.Questions).ThenInclude(qu => qu.Options)
                 .OrderBy(q => q.CreatedAt)
                 .ToListAsync();

    public async Task<Quiz?> FindAsync(Guid id) =>
        await _db.Quizzes
                 .Include(q => q.Questions).ThenInclude(qu => qu.Options)
                 .FirstOrDefaultAsync(q => q.Id == id);

    public async Task<Quiz> AddAsync(string title, string? description, string ownerId)
    {
        var quiz = new Quiz { Title = title, Description = description, OwnerId = ownerId };
        _db.Quizzes.Add(quiz);
        await _db.SaveChangesAsync();
        return quiz;
    }

    public async Task<bool> UpdateAsync(Guid id, string title, string? description)
    {
        var existing = await _db.Quizzes.FindAsync(id);
        if (existing is null) return false;

        existing.Title = title;
        existing.Description = description;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveAsync(Guid id)
    {
        var existing = await _db.Quizzes.FindAsync(id);
        if (existing is null) return false;

        _db.Quizzes.Remove(existing);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<Quiz?> AddQuestionAsync(Guid quizId, string text, List<(string Text, bool IsCorrect)> options)
    {
        var quizExists = await _db.Quizzes.AnyAsync(q => q.Id == quizId);
        if (!quizExists) return null;

        // Add explicitly (not via quiz.Questions.Add) so EF issues an INSERT.
        // A client-set Guid key + EF's store-generated convention can otherwise
        // make EF mistake the new row for an existing one and emit an UPDATE.
        // The options ride along as part of the same new-entity graph, so EF
        // inserts them too — no separate SaveChangesAsync needed for them.
        var question = new Question
        {
            Text = text,
            QuizId = quizId,
            Options = options.Select(o => new AnswerOption { Text = o.Text, IsCorrect = o.IsCorrect }).ToList()
        };
        _db.Questions.Add(question);
        await _db.SaveChangesAsync();

        return await _db.Quizzes
                        .Include(q => q.Questions).ThenInclude(qu => qu.Options)
                        .FirstOrDefaultAsync(q => q.Id == quizId);
    }
}
