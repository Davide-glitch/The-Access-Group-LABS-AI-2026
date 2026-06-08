using System.ComponentModel.DataAnnotations;

namespace Lab6.Dtos;

public class CreateQuizDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = "";

    [StringLength(2000)]
    public string? Description { get; set; }
}
