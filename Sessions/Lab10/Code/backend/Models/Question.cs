using System.Text.Json.Serialization;

namespace Lab7.Models;

public class Question
{
    public Guid   Id   { get; set; } = Guid.NewGuid();
    public string Text { get; set; } = "";

    // NEW for Lab 9 — each question now carries its own answer options. A
    // question with no options is still allowed (Lab 8-style, text only);
    // one with options must have exactly one IsCorrect = true (enforced by
    // the controller, not by a data annotation — "exactly one of N" isn't
    // expressible that way).
    public List<AnswerOption> Options { get; set; } = [];

    // Foreign key + navigation back to the owning quiz.
    public Guid QuizId { get; set; }

    [JsonIgnore] // break the Quiz -> Questions -> Quiz serialization cycle
    public Quiz? Quiz { get; set; }
}
