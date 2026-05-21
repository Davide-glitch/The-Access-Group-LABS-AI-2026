using System.ClientModel;
using System.ComponentModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;

[Description("Gets the current weather for a requested location.")]
static string GetWeather([Description("The city, region, or place to get the weather for.")] string location)
{
    var normalizedLocation = string.IsNullOrWhiteSpace(location) ? "your location" : location.Trim();
    var seed = normalizedLocation.ToUpperInvariant().Sum(static character => character);

    string[] conditions = ["sunny", "partly cloudy", "cloudy", "light rain", "windy"];
    var temperatureCelsius = 14 + (seed % 17);
    var condition = conditions[seed % conditions.Length];
    var humidity = 45 + (seed % 45);

    return $"Current weather for {normalizedLocation}: {condition}, {temperatureCelsius}C, humidity {humidity}%.";
}

var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
    ?? throw new InvalidOperationException("Set GITHUB_TOKEN to a GitHub personal access token with the 'models' scope.");

var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

var openAIClient = new OpenAIClient(
    new ApiKeyCredential(token),
    new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

AIAgent agent = openAIClient
    .GetChatClient(modelId)
    .CreateAIAgent(
        instructions: "You are a concise, friendly assistant. Use the get_weather tool whenever the user asks about weather conditions.",
        tools: [AIFunctionFactory.Create(GetWeather, name: "get_weather")],
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
