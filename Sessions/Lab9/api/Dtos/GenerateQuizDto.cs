using System.ComponentModel.DataAnnotations;

namespace Lab7.Dtos;

// NEW for Lab 9 — the payload for POST /quizzes/generate. The student (or
// instructor) pastes in a longer piece of text — an article, lecture notes,
// a study guide — and the model on the other end writes a quiz about it.
public class GenerateQuizDto
{
    [Required]
    [StringLength(20000, MinimumLength = 200)]
    public string SourceText { get; set; } = "";

    [StringLength(200, MinimumLength = 3)]
    public string? Title { get; set; }

    [Range(3, 10)]
    public int QuestionCount { get; set; } = 5;
}
