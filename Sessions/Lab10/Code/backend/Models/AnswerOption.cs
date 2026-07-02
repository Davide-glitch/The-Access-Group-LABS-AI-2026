using System.Text.Json.Serialization;

namespace Lab7.Models;

// NEW for Lab 9 — a question now carries its own answer options, with
// exactly one IsCorrect = true. This is what makes server-side grading
// possible: the database (not the browser) knows which option is right.
public class AnswerOption
{
    public Guid   Id        { get; set; } = Guid.NewGuid();
    public string Text      { get; set; } = "";
    public bool   IsCorrect { get; set; }

    // Foreign key + navigation back to the owning question.
    public Guid QuestionId { get; set; }

    [JsonIgnore] // break the Question -> Options -> Question serialization cycle
    public Question? Question { get; set; }
}
