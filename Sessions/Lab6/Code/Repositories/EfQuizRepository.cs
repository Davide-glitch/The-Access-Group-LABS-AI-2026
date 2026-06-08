using Lab6.Data;
using Lab6.Models;
using Microsoft.EntityFrameworkCore;

namespace Lab6.Repositories;

public class EfQuizRepository : IQuizRepository
{
    private readonly QuizzesDbContext _db;

    public EfQuizRepository(QuizzesDbContext db) => _db = db;

    public async Task<IEnumerable<Quiz>> AllAsync(string? tag = null)
    {
        var query = _db.Quizzes
                       .Include(q => q.Questions)
                       .Include(q => q.Tags)
                       .AsQueryable();

        if (!string.IsNullOrWhiteSpace(tag))
        {
            query = query.Where(q => q.Tags.Any(t => t.Name.ToLower() == tag.ToLower()));
        }

        return await query.OrderBy(q => q.CreatedAt).ToListAsync();
    }

    public async Task<Quiz?> FindAsync(Guid id) =>
        await _db.Quizzes
                 .Include(q => q.Questions)
                 .Include(q => q.Tags)
                 .FirstOrDefaultAsync(q => q.Id == id);

    public async Task<Quiz> AddAsync(string title, string? description)
    {
        var quiz = new Quiz { Title = title, Description = description };
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

    public async Task<Quiz?> AddQuestionAsync(Guid quizId, string text)
    {
        var quizExists = await _db.Quizzes.AnyAsync(q => q.Id == quizId);
        if (!quizExists) return null;

        _db.Questions.Add(new Question { Text = text, QuizId = quizId });
        await _db.SaveChangesAsync();

        return await _db.Quizzes
                        .Include(q => q.Questions)
                        .Include(q => q.Tags)
                        .FirstOrDefaultAsync(q => q.Id == quizId);
    }

    public async Task<Quiz?> AddTagAsync(Guid quizId, string tagName)
    {
        var quiz = await _db.Quizzes.Include(q => q.Tags).FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz is null) return null;

        var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == tagName.ToLower());
        if (tag is null)
        {
            tag = new Tag { Name = tagName };
            _db.Tags.Add(tag);
        }

        if (!quiz.Tags.Any(t => t.Id == tag.Id))
        {
            quiz.Tags.Add(tag);
        }

        await _db.SaveChangesAsync();
        return quiz;
    }
}