namespace Lab7.Services;

public interface IQuizGenerator
{
    Task<GeneratedQuizPayload> GenerateAsync(
        string sourceText, int questionCount, CancellationToken cancellationToken = default);
}

public class GeneratedQuizPayload
{
    public List<GeneratedQuestionPayload> Questions { get; set; } = [];
}

public class GeneratedQuestionPayload
{
    public string Text { get; set; } = "";
    public List<GeneratedOptionPayload> Options { get; set; } = [];
}

public class GeneratedOptionPayload
{
    public string Text { get; set; } = "";
    public bool IsCorrect { get; set; }
}