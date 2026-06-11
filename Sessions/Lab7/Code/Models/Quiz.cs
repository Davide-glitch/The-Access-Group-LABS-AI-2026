namespace Lab7.Models;

public class Quiz
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ADD THIS LINE: The stable user ID from the token
    public string OwnerId { get; set; } = "";

    public List<Question> Questions { get; set; } = [];
}