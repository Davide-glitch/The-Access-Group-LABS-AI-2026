namespace Lab7.Dtos;

// NEW for Lab 9 — the response from POST /quizzes/{id}/evaluate. Unlike
// PlayQuizDto, this one DOES reveal which option was correct — that's fine
// here, because it's only returned after the student has already submitted
// their answers.
public class ResultOptionDto
{
    public Guid   Id        { get; set; }
    public string Text      { get; set; } = "";
    public bool   IsCorrect { get; set; }
}

public class QuestionResultDto
{
    public Guid   QuestionId       { get; set; }
    public string QuestionText     { get; set; } = "";
    public Guid?  SelectedOptionId { get; set; }
    public Guid   CorrectOptionId  { get; set; }
    public bool   WasCorrect       { get; set; }
    public List<ResultOptionDto> Options { get; set; } = [];
}

public class QuizResultDto
{
    public int    TotalQuestions  { get; set; }
    public int    CorrectCount    { get; set; }
    public double ScorePercentage { get; set; }
    public List<QuestionResultDto> Results { get; set; } = [];
}
