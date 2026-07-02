namespace Lab7.Dtos;

// NEW for Lab 9 — the response from GET /quizzes/{id}/play. This shape
// never includes IsCorrect: a student picking answers shouldn't be able to
// read the right one out of the network response before grading.
public class PlayOptionDto
{
    public Guid   Id   { get; set; }
    public string Text { get; set; } = "";
}

public class PlayQuestionDto
{
    public Guid   Id   { get; set; }
    public string Text { get; set; } = "";
    public List<PlayOptionDto> Options { get; set; } = [];
}

public class PlayQuizDto
{
    public Guid    Id          { get; set; }
    public string  Title       { get; set; } = "";
    public string? Description { get; set; }
    public List<PlayQuestionDto> Questions { get; set; } = [];
}
