using System.Text.Json.Serialization;

namespace Lab6.Models;

public class Question
{
    public Guid   Id   { get; set; } = Guid.NewGuid();
    public string Text { get; set; } = "";

    // Foreign key + navigation back to the owning quiz.
    public Guid QuizId { get; set; }

    [JsonIgnore] // break the Quiz -> Questions -> Quiz serialization cycle
    public Quiz? Quiz { get; set; }
}
