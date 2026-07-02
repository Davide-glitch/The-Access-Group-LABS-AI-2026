using System.ComponentModel.DataAnnotations;

namespace Lab7.Dtos;

public class CreateQuestionDto
{
    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Text { get; set; } = "";

    // NEW for Lab 9 — optional, so Lab 8-style text-only questions still
    // work. When supplied, the controller requires at least two options
    // with exactly one IsCorrect = true.
    public List<CreateAnswerOptionDto> Options { get; set; } = [];
}
