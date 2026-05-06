using System.ClientModel;
using Microsoft.Agents.AI;
using OpenAI;

var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
    ?? throw new InvalidOperationException("Set GITHUB_TOKEN to a GitHub personal access token with the 'models' scope.");

var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

var openAIClient = new OpenAIClient(
    new ApiKeyCredential(token),
    new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

AIAgent agent = openAIClient
    .GetChatClient(modelId)
    .CreateAIAgent(
        instructions: "You are a concise, friendly assistant.",
        name: "Assistant");

var thread = agent.GetNewThread();

Console.WriteLine($"Chatting with {modelId} via GitHub Models. Type 'exit' to quit.");
Console.WriteLine();

while (true)
{
    Console.Write("You: ");
    var input = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(input)) continue;
    if (input.Equals("exit", StringComparison.OrdinalIgnoreCase)) break;

    Console.Write("Assistant: ");
    await foreach (var update in agent.RunStreamingAsync(input, thread))
    {
        Console.Write(update);
    }
    Console.WriteLine();
    Console.WriteLine();
}
