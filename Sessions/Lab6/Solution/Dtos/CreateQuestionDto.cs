using System.ComponentModel.DataAnnotations;

namespace Lab6.Dtos;

public class CreateQuestionDto
{
    [Required]
    [StringLength(500, MinimumLength = 3)]
    public string Text { get; set; } = "";
}
