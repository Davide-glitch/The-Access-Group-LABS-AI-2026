# Lab 10 — API reference solution (AI agent, play view, grading)

Same backend, same namespace (`Lab7`), same auth and ownership rules as
every lab since Lab 7. This is the finished version of what `../../Code/backend`
walks you toward — see that folder's README for what changed and why.

## What's here

1. **`POST /quizzes/generate` — an agent, not a one-shot prompt.**
   `Services/OpenAiQuizGenerator.cs` wraps the plain `OpenAI.Chat.ChatClient`
   in `Microsoft.Extensions.AI`'s `IChatClient`, adds `UseFunctionInvocation()`
   middleware, and hands the model two tools:
   - `list_existing_quiz_titles` — reads real data via `IQuizRepository`, so
     the model can avoid duplicating an existing quiz's topic.
   - `create_quiz` — the model's *final answer*. Its parameters are the
     finished quiz; the method validates them (2+ options, exactly one
     correct) before accepting. If validation throws, the middleware feeds
     the error back to the model as the tool's result — a malformed first
     attempt becomes a self-correction opportunity, not a hard failure.

   Registered `Scoped` in `Program.cs`, not `Singleton` like Lab 9's version
   — it now depends on the `Scoped` `IQuizRepository`.

2. **`GET /quizzes/{id}/play`** and **3. `POST /quizzes/{id}/evaluate`** —
   unchanged from Lab 9: the "no peeking" view and server-side grading.

`GITHUB_TOKEN` must be set in the environment before `dotnet run` for
`/quizzes/generate` to work — needs the "models" scope (classic PAT) or the
"Models" permission (fine-grained PAT).

## Run it

```bash
# 1. create/upgrade the database from the migrations (LocalDB; Docker fallback below)
dotnet ef database update

# 2. make sure your GitHub Models token is set (same one as Lab 1-4)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 3. run — port is pinned to 5023, same as every lab so far
dotnet run
```

Open <http://localhost:5023/swagger> and confirm:

- `GET /quizzes` works **without** clicking Authorize — `200`.
- `GET /quizzes/{id}/play` on an existing quiz → `200`, options but no `isCorrect`.
- `POST /quizzes/{id}/evaluate` with a guess → `200`, a score, and the
  correct answers are visible in the response.
- `POST /quizzes/generate` (signed in, with `GITHUB_TOKEN` set) with a
  paragraph of text → `201`, a new quiz with AI-written, non-duplicate questions.

### Docker fallback (no LocalDB)

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Then point the `QuizzesDb` connection string in `appsettings.Development.json` at:

```
Server=127.0.0.1,1433;Database=QuizzesDb;User Id=sa;Password=Your_strong_Pass1;TrustServerCertificate=True
```

Use `127.0.0.1`, not `localhost` — on some Windows/Docker Desktop setups
`localhost` resolves to `::1` first and the TDS handshake silently times out
even though a raw TCP port check succeeds.

> Requires the EF CLI once per machine: `dotnet tool install --global dotnet-ef`

## What the frontend in `../frontend` expects

- The API running at `http://localhost:5023`, `GITHUB_TOKEN` set if it'll call `/quizzes/generate`.
- `GET /quizzes`, `GET /quizzes/{id}/play` reachable with no `Authorization` header.
- A "play" quiz shaped like:

```json
{
  "id": "...", "title": "...", "description": "...",
  "questions": [
    { "id": "...", "text": "...", "options": [{ "id": "...", "text": "..." }] }
  ]
}
```

- An evaluate response shaped like:

```json
{
  "totalQuestions": 3, "correctCount": 2, "scorePercentage": 66.7,
  "results": [
    {
      "questionId": "...", "questionText": "...",
      "selectedOptionId": "...", "correctOptionId": "...", "wasCorrect": true,
      "options": [{ "id": "...", "text": "...", "isCorrect": true }]
    }
  ]
}
```
