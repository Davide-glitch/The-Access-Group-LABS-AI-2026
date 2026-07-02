using System.ComponentModel.DataAnnotations;

namespace Lab7.Dtos;

public class UpdateQuizDto
{
    [Required]
    [StringLength(200, MinimumLength = 3)]
    public string Title { get; set; } = "";

    [StringLength(2000)]
    public string? Description { get; set; }
}
