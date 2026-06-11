using Lab7.Models;
using Microsoft.EntityFrameworkCore;

namespace Lab7.Data;

public class QuizzesDbContext : DbContext
{
    public QuizzesDbContext(DbContextOptions<QuizzesDbContext> options)
        : base(options) { }

    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var seededAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // The "house" account. No real person has this oid.
        const string seedOwner = "00000000-0000-0000-0000-00000000feed";

        modelBuilder.Entity<Quiz>().HasData(
            new Quiz
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Title = "C# fundamentals",
                Description = "Variables, types, control flow, methods.",
                CreatedAt = seededAt,
                OwnerId = seedOwner
            },
            new Quiz
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Title = "HTTP basics",
                Description = "Verbs, status codes, headers.",
                CreatedAt = seededAt,
                OwnerId = seedOwner
            },
            new Quiz
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Title = "REST principles",
                Description = "Resources, idempotency, anti-patterns.",
                CreatedAt = seededAt,
                OwnerId = seedOwner
            });
    }
}
