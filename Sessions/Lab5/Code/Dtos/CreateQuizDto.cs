using System.ComponentModel.DataAnnotations;

namespace Lab5.Dtos;

public class CreateQuizDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = "";

    [StringLength(2000)]
    public string? Description { get; set; }
}