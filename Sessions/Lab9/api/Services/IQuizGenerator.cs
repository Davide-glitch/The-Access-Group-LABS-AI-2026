namespace Lab7.Services;

// NEW for Lab 9 — the abstraction the controller depends on, so it never
// talks to the OpenAI client directly (same "depend on the interface, not
// the concrete type" rule as IQuizRepository).
public interface IQuizGenerator
{
    Task<GeneratedQuizPayload> GenerateAsync(
        string sourceText, int questionCount, CancellationToken cancellationToken = default);
}

// The shape we ask the model to fill in. Plain classes with public
// get/set properties — that's what we deserialize the model's JSON
// response into, and what the JSON schema we send it describes.
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
