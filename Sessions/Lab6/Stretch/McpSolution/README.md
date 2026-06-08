# Stretch — MCP Solution (Streamable HTTP)

The completed reference for the **"Expose your API as MCP tools"** stretch challenge.
It's the Lab 6 `Solution/` plus an MCP server hosted *inside* the same ASP.NET app,
exposed over the **Streamable HTTP** transport at `/mcp`.

Worked example for `../stretch-challenges.html`. Build it yourself from your own
Lab 6 solution — this is the answer key.

## What's added on top of Lab 6's Solution

- `ModelContextProtocol.AspNetCore` package (see `Lab6.csproj`)
- `Mcp/QuizTools.cs` — four tools (`list_quizzes`, `get_quiz`, `create_quiz`, `add_question`) that inject the same `IQuizRepository` the controller uses
- `Program.cs` — `AddMcpServer().WithHttpTransport().WithToolsFromAssembly()` and `app.MapMcp("/mcp")`
- `.vscode/mcp.json` — registers the server with VS Code / GitHub Copilot

## Run it

```bash
dotnet ef database update   # once, creates the DB from the migrations
dotnet run                  # serves REST at /quizzes AND MCP at /mcp on :5023
```

- REST API + Swagger: <http://localhost:5023/swagger>
- MCP endpoint (Streamable HTTP): `http://localhost:5023/mcp`

## Connect from VS Code + GitHub Copilot

1. Open this folder in VS Code (needs Copilot + Copilot Chat, **agent mode**).
2. Open `.vscode/mcp.json` and click **Start** above the `quizzes` server.
3. Open Copilot Chat → **Agent** mode → the four quiz tools appear in the tools picker.
4. Try: *"Create a quiz called 'REST basics' and add three questions to it."*

The agent's tool calls hit the same SQL Server database as the REST API — create a
quiz via Copilot, then `GET /quizzes` and watch it appear.

> No auth on `/mcp` — local development only.
