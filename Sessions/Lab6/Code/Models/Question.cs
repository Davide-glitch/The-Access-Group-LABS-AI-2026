using System.Text.Json.Serialization;

namespace Lab6.Models;

public class Question
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Text { get; set; } = "";

    // foreign key + navigare înapoi către testul de care aparține
    public Guid QuizId { get; set; }

    [JsonIgnore] // Oprește ciclul infinit de serializare JSON
    public Quiz? Quiz { get; set; }
}