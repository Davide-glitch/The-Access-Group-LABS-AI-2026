namespace Lab6.Models;

public class Quiz
{
    public Guid     Id          { get; set; } = Guid.NewGuid();
    public string   Title       { get; set; } = "";
    public string?  Description { get; set; }
    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;

    public List<Question> Questions { get; set; } = [];
}
