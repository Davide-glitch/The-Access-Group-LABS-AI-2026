using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ClientModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using OpenAI;

// ─── CONFIGURATION ─────────────────────────────────────────────────────────

var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
    ?? throw new InvalidOperationException("Set GITHUB_TOKEN to a GitHub personal access token with the 'models' scope.");

var chatModelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";
var embeddingModelId = Environment.GetEnvironmentVariable("GITHUB_EMBED_MODEL") ?? "openai/text-embedding-3-small";

var openAIClient = new OpenAIClient(
    new ApiKeyCredential(token),
    new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

// ─── INGESTION (RAG) ───────────────────────────────────────────────────────

var store = new List<Chunk>();
var embeddingClient = openAIClient.GetEmbeddingClient(embeddingModelId);
var kb = new KnowledgeBase(store, embeddingClient);

// Am setat calea exacta a folderului curent ca sa nu mai caute in bin/Debug
var docsPath = Path.Combine(Directory.GetCurrentDirectory(), "Docs");

Console.WriteLine($"Ingesting documents from {docsPath}...");

if (!Directory.Exists(docsPath))
{
    Directory.CreateDirectory(docsPath);
    Console.WriteLine("Folderul Docs nu exista, asa ca l-am creat. Adauga fisiere .md in el!");
}

foreach (var file in Directory.GetFiles(docsPath, "*.md"))
{
    var text = await File.ReadAllTextAsync(file);
    var chunks = Chunker.Split(text, chunkSize: 1500, overlap: 200);
    var chunkCount = 0;

    foreach (var chunk in chunks)
    {
        // Punct vizual ca sa stii ca nu s-a blocat
        Console.Write(".");

        var vector = await kb.EmbedAsync(chunk);
        store.Add(new Chunk(vector, chunk, Path.GetFileName(file)));
        chunkCount++;

        // Pauza necesara pentru a evita eroarea 429 Too Many Requests
        await Task.Delay(1000);
    }

    Console.WriteLine($"\n  {Path.GetFileName(file),30}  ->  {chunkCount} chunk(s) procesate");
}

Console.WriteLine($"\nReady - {store.Count} chunks indexed.\n");

// ─── AGENT SETUP ───────────────────────────────────────────────────────────

var openAIChatClient = openAIClient.GetChatClient(chatModelId);

IChatClient client = new ChatClientBuilder(openAIChatClient.AsIChatClient())
    .UseFunctionInvocation()
    .Build();

var searchTool = AIFunctionFactory.Create(kb.SearchAsync, name: "search_knowledge_base");

var chatOptions = new ChatOptions { Tools = [searchTool] };

var history = new List<ChatMessage>
{
    new ChatMessage(ChatRole.System,
        "You are a helpful company assistant for Acme Software Ltd. " +
        "For any question about internal policies, IT, HR, benefits, expenses, or products, " +
        "always call search_knowledge_base before answering. " +
        "If the knowledge base returns no relevant result, say so clearly rather than guessing. " +
        "Cite the source document when you use retrieved information.")
};

Console.WriteLine($"Company assistant ready (model: {chatModelId}).");
Console.WriteLine("Ask anything about company policies, IT, or HR. Type 'exit' to quit.\n");

// ─── CHAT LOOP ─────────────────────────────────────────────────────────────

while (true)
{
    Console.Write("You: ");
    var input = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(input)) continue;
    if (input.Equals("exit", StringComparison.OrdinalIgnoreCase)) break;

    history.Add(new ChatMessage(ChatRole.User, input));
    Console.Write("Assistant: ");

    var fullResponse = "";
    await foreach (var update in client.GetStreamingResponseAsync(history, chatOptions))
    {
        Console.Write(update.Text);
        fullResponse += update.Text;
    }
    Console.WriteLine("\n");

    history.Add(new ChatMessage(ChatRole.Assistant, fullResponse));
}

// ─── TYPES & LOGIC ─────────────────────────────────────────────────────────

record Chunk(float[] Vector, string Text, string Source);

static class Chunker
{
    public static IEnumerable<string> Split(string text, int chunkSize, int overlap)
    {
        int start = 0;
        while (start < text.Length)
        {
            int end = Math.Min(start + chunkSize, text.Length);
            yield return text[start..end];
            if (end == text.Length) break;
            start += chunkSize - overlap;
        }
    }
}

class KnowledgeBase(List<Chunk> store, OpenAI.Embeddings.EmbeddingClient embeddingClient)
{
    public async Task<float[]> EmbedAsync(string text)
    {
        var result = await embeddingClient.GenerateEmbeddingAsync(text);
        return result.Value.ToFloats().ToArray();
    }

    [Description(
        "Search the company knowledge base for information about HR policies, IT support, " +
        "benefits, onboarding, expenses, or products. " +
        "Always call this tool before answering questions about internal company topics.")]
    public async Task<string> SearchAsync(
        [Description("The user's question, rephrased as a focused search query")] string query,
        [Description("Number of top results to return. Default is 3.")] int topK = 3)
    {
        var queryVector = await EmbedAsync(query);

        var results = store
            .Select(c => (Chunk: c, Score: CosineSimilarity(queryVector, c.Vector)))
            .OrderByDescending(x => x.Score)
            .Take(topK)
            .Where(x => x.Score > 0.4f)
            .ToList();

        if (results.Count == 0)
            return "No relevant information found in the knowledge base for this query.";

        return string.Join("\n\n---\n\n", results.Select(
            r => $"[Source: {r.Chunk.Source} | Relevance: {r.Score:P0}]\n{r.Chunk.Text}"));
    }

    static float CosineSimilarity(float[] a, float[] b)
    {
        float dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return dot / (MathF.Sqrt(magA) * MathF.Sqrt(magB));
    }
}