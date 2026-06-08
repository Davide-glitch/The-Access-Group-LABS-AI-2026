using System.ComponentModel.DataAnnotations;

namespace Lab6.Dtos;

public class CreateTagDto
{
    [Required]
    [StringLength(50, MinimumLength = 2)]
    public string Name { get; set; } = "";
}