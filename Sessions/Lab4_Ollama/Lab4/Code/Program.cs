using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Threading.Tasks;
using System.ClientModel;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel.Connectors.Qdrant;
using OpenAI;
using Qdrant.Client;

// ─── CONFIGURATION (Ollama Local Setup) ────────────────────────────────────

var ollamaEndpoint = new Uri("http://localhost:11434/v1");

var openAIClient = new OpenAIClient(
    new ApiKeyCredential("local-dummy-key"),
    new OpenAIClientOptions { Endpoint = ollamaEndpoint });

var chatModelId = "llama3.1";
var embeddingModelId = "nomic-embed-text";

// ─── DATABASE SETUP (Qdrant) ───────────────────────────────────────────────

var qdrantClient = new QdrantClient("localhost");

// Fix: The new preview API removed the boolean parameter
var vectorStore = new QdrantVectorStore(qdrantClient);

var collection = vectorStore.GetCollection<Guid, Chunk>("company-docs-ollama");

var collectionExists = await collection.CollectionExistsAsync();
if (!collectionExists)
{
    await collection.CreateCollectionIfNotExistsAsync();
    Console.WriteLine("Created new Qdrant collection: company-docs-ollama");
}

var embeddingClient = openAIClient.GetEmbeddingClient(embeddingModelId);
var kb = new KnowledgeBase(collection, embeddingClient);

// ─── INGESTION ─────────────────────────────────────────────────────────────

var docsPath = Path.Combine(Directory.GetCurrentDirectory(), "Docs");
Console.WriteLine($"Ingesting documents from {docsPath}...");

if (!Directory.Exists(docsPath))
{
    Directory.CreateDirectory(docsPath);
}

foreach (var file in Directory.GetFiles(docsPath, "*.md"))
{
    var text = await File.ReadAllTextAsync(file);
    var chunks = Chunker.Split(text, chunkSize: 1500, overlap: 200);
    var chunkCount = 0;

    foreach (var chunkText in chunks)
    {
        Console.Write(".");
        var vector = await kb.EmbedAsync(chunkText);

        var record = new Chunk
        {
            Id = Guid.NewGuid(),
            Text = chunkText,
            Source = Path.GetFileName(file),
            Category = "General",
            Vector = new ReadOnlyMemory<float>(vector)
        };

        await collection.UpsertAsync(record);
        chunkCount++;
    }

    Console.WriteLine($"\n  {Path.GetFileName(file),30}  ->  {chunkCount} chunk(s) processed");
}

Console.WriteLine("\nReady. Local Vector Database loaded via Ollama.\n");

// ─── AGENT SETUP ───────────────────────────────────────────────────────────

var openAIChatClient = openAIClient.GetChatClient(chatModelId);

// Fix: Renamed from AsIChatClient to AsChatClient in latest preview
IChatClient client = new ChatClientBuilder(openAIChatClient.AsChatClient())
    .UseFunctionInvocation()
    .Build();

var searchTool = AIFunctionFactory.Create(kb.SearchAsync, name: "search_knowledge_base");

var chatOptions = new ChatOptions { Tools = [searchTool] };

var history = new List<ChatMessage>
{
    new ChatMessage(ChatRole.System,
        "You are a helpful company assistant for Acme Software Ltd. " +
        "For any question about internal policies, always call search_knowledge_base before answering. " +
        "Cite the source document when you use retrieved information.")
};

Console.WriteLine($"Company assistant ready (model: {chatModelId} local).");
Console.WriteLine("Type 'exit' to quit.\n");

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

    // Fix: Renamed from GetStreamingResponseAsync to CompleteStreamingAsync in latest preview
    await foreach (var update in client.CompleteStreamingAsync(history, chatOptions))
    {
        Console.Write(update.Text);
        fullResponse += update.Text;
    }
    Console.WriteLine("\n");

    history.Add(new ChatMessage(ChatRole.Assistant, fullResponse));
}

// ─── TYPES & LOGIC ─────────────────────────────────────────────────────────

class Chunk
{
    [VectorStoreRecordKey]
    public Guid Id { get; set; }

    [VectorStoreRecordData]
    public string Text { get; set; } = string.Empty;

    [VectorStoreRecordData]
    public string Source { get; set; } = string.Empty;

    [VectorStoreRecordData]
    public string Category { get; set; } = string.Empty;

    [VectorStoreRecordVector(768)]
    public ReadOnlyMemory<float> Vector { get; set; }
}

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

class KnowledgeBase(Microsoft.Extensions.VectorData.IVectorStoreRecordCollection<Guid, Chunk> collection, OpenAI.Embeddings.EmbeddingClient embeddingClient)
{
    public async Task<float[]> EmbedAsync(string text)
    {
        var result = await embeddingClient.GenerateEmbeddingAsync(text);
        return result.Value.ToFloats().ToArray();
    }

    [Description("Search the company knowledge base for internal policies. Always call this tool first.")]
    public async Task<string> SearchAsync(
        [Description("The user's question, rephrased as a search query")] string query,
        [Description("Number of top results to return. Default is 3.")] int topK = 3)
    {
        var queryVector = await EmbedAsync(query);

        var options = new VectorSearchOptions()
        {
            Top = topK
        };

        var searchResults = await collection.VectorizedSearchAsync(new ReadOnlyMemory<float>(queryVector), options);

        var results = new List<string>();

        // Fix: GetResultsAsync() was replaced by the Results property in latest preview
        await foreach (var hit in searchResults.Results)
        {
            if (hit.Score > 0.4f)
            {
                results.Add($"[Source: {hit.Record.Source} | Relevance: {hit.Score:P0}]\n{hit.Record.Text}");
            }
        }

        if (results.Count == 0)
            return "No relevant information found in the knowledge base for this query.";

        return string.Join("\n\n---\n\n", results);
    }
}