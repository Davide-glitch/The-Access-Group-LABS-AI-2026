using System.ComponentModel.DataAnnotations;

namespace Lab7.Dtos;

public class CreateAnswerOptionDto
{
    [Required]
    [StringLength(300, MinimumLength = 1)]
    public string Text { get; set; } = "";

    public bool IsCorrect { get; set; }
}
