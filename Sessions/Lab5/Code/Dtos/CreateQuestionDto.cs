using System.ComponentModel.DataAnnotations;

namespace Lab5.Dtos;

public class CreateQuestionDto
{
    [Required]
    [StringLength(500, MinimumLength = 5)]
    public string Text { get; set; } = "";

    [Required]
    [StringLength(200, MinimumLength = 1)]
    public string CorrectAnswer { get; set; } = "";
}