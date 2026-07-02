namespace Lab7.Dtos;

// NEW for Lab 9 — what the browser POSTs to /quizzes/{id}/evaluate: one
// selected option id per answered question (omit a question to leave it
// unanswered).
public class SubmitAnswerDto
{
    public Guid  QuestionId       { get; set; }
    public Guid? SelectedOptionId { get; set; }
}

public class SubmitQuizDto
{
    public List<SubmitAnswerDto> Answers { get; set; } = [];
}
