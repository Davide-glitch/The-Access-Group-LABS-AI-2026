using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ClientModel;
using Microsoft.Extensions.AI;
using OpenAI;

var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
    ?? throw new InvalidOperationException("Set GITHUB_TOKEN to a GitHub personal access token with the 'models' scope.");

var modelId = Environment.GetEnvironmentVariable("GITHUB_MODEL") ?? "openai/gpt-4o-mini";

var openAIClient = new OpenAIClient(
    new ApiKeyCredential(token),
    new OpenAIClientOptions { Endpoint = new Uri("https://models.github.ai/inference") });

var openAIChatClient = openAIClient.GetChatClient(modelId);

IChatClient client = new ChatClientBuilder(openAIChatClient.AsIChatClient())
    .UseFunctionInvocation()
    .Build();

var weatherTool = AIFunctionFactory.Create(GetWeather);
var currencyTool = AIFunctionFactory.Create(ConvertCurrency);
var flightsTool = AIFunctionFactory.Create(SearchFlights);

var chatOptions = new ChatOptions
{
    Tools = [weatherTool, currencyTool, flightsTool]
};

var history = new List<ChatMessage>
{
    new ChatMessage(ChatRole.System, """
        You are a helpful travel assistant. Follow these logical rules:
        1. If a user asks for flights, always check the weather for their destination automatically.
        2. If a user asks for a price, always ask what currency they want it in before converting.
        3. If origin and destination are the same, politely explain that flying to the same city is not possible.
        4. Be concise and format lists using Markdown.
        """)
};

Console.WriteLine($"Chatting with {modelId} via GitHub Models. Type 'exit' to quit.\n");

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

[Description("Get the current weather for a city")]
static WeatherResult GetWeather(
    [Description("City name, e.g. Bucharest")] string city,
    [Description("Unit: 'celsius' or 'fahrenheit'")] string unit = "celsius")
{
    if (!WeatherState.Memory.TryGetValue(city, out var data))
    {
        string[] conditions = { "Sunny", "Clear", "Partly Cloudy", "Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Thunderstorm", "Snow", "Sleet", "Fog", "Windy" };
        data = (Random.Shared.Next(-10, 41), conditions[Random.Shared.Next(conditions.Length)]);
        WeatherState.Memory[city] = data;
    }

    bool isFahrenheit = unit.Equals("fahrenheit", StringComparison.OrdinalIgnoreCase);
    int temp = isFahrenheit ? (int)(data.TempC * 1.8 + 32) : data.TempC;

    return new WeatherResult(city, temp, unit, data.Condition);
}

[Description("Converts money between currencies. Requires the exact 3-letter currency codes (e.g., USD, EUR, RON).")]
static CurrencyResult ConvertCurrency(
    [Description("The amount to convert")] double amount,
    [Description("The source currency code (e.g., USD, EUR)")] string fromCurrency,
    [Description("The target currency code (e.g., EUR, GBP)")] string toCurrency)
{
    double rate = (fromCurrency.ToUpper(), toCurrency.ToUpper()) switch
    {
        ("USD", "EUR") => 0.92,
        ("EUR", "USD") => 1.09,
        ("USD", "GBP") => 0.79,
        ("GBP", "USD") => 1.27,
        ("EUR", "GBP") => 0.86,
        ("GBP", "EUR") => 1.16,
        ("USD", "RON") => 4.62,
        ("EUR", "RON") => 4.97,
        _ => Math.Round(1.0 + (Random.Shared.NextDouble() * 0.5), 2)
    };

    return new CurrencyResult(amount, fromCurrency.ToUpper(), toCurrency.ToUpper(), Math.Round(amount * rate, 2));
}

[Description("Search for flights between two cities on a specific date")]
static FlightResult SearchFlights(
    [Description("The departure city")] string origin,
    [Description("The destination city")] string destination,
    [Description("The date of travel (e.g., YYYY-MM-DD)")] string date)
{
    if (string.IsNullOrWhiteSpace(date) || origin.Equals(destination, StringComparison.OrdinalIgnoreCase))
    {
        return new FlightResult(origin, destination, date, Array.Empty<Flight>());
    }

    var flights = new[]
    {
        new Flight("SkyHigh Airlines", "08:00", "10:30", 250.00),
        new Flight("Oceanic Air", "13:15", "15:45", 195.50),
        new Flight("Galaxy Airways", "18:30", "21:00", 320.00)
    };

    return new FlightResult(origin, destination, date, flights);
}

static class WeatherState
{
    public static readonly Dictionary<string, (int TempC, string Condition)> Memory = new(StringComparer.OrdinalIgnoreCase);
}

record WeatherResult(string City, int Temperature, string Unit, string Description);
record CurrencyResult(double OriginalAmount, string From, string To, double ConvertedAmount);
record Flight(string Airline, string DepartureTime, string ArrivalTime, double Price);
record FlightResult(string Origin, string Destination, string Date, Flight[] Flights);