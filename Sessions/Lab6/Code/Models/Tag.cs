using System.Text.Json.Serialization;

namespace Lab6.Models;

public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";

    // Skip navigation back to Quizzes
    [JsonIgnore] // Prevents infinite JSON loops
    public List<Quiz> Quizzes { get; set; } = [];
}