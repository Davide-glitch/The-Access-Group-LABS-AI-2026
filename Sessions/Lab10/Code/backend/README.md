# Lab 10 — API (build the AI agent, the play view, and grading)

Same backend, same namespace (`Lab7`), same auth and ownership rules as
every lab since Lab 7. This time the backend *is* the hands-on part — the
React app in `../frontend` is already fully built (it's Lab 9's finished
Solution) and already expects the three endpoints below; your job this
session is to make it work against a real API instead of a 404.

## What you're building

1. **`POST /quizzes/generate` — an AI agent, not a one-shot prompt.**
   Lab 9's version called the model once and asked for structured JSON
   back. This time the model gets two *tools*: `list_existing_quiz_titles`
   (so it can avoid writing a quiz that duplicates one that already exists)
   and `create_quiz` (which IS the final answer — its arguments are the
   finished quiz, validated the moment it's called). `Microsoft.Extensions.AI`'s
   function-invocation middleware runs the tool-call loop for you; you write
   the tools and the prompt.

2. **`GET /quizzes/{id}/play` — the "no peeking" view.** Returns questions
   and options *without* `IsCorrect`. `[AllowAnonymous]`, same as `List()` —
   grading is a read/compute, not a write.

3. **`POST /quizzes/{id}/evaluate` — server-side grading.** The browser
   posts back `{ answers: [{ questionId, selectedOptionId }] }`; you look up
   the real correct option for each question server-side (never trust a
   client's claim about which answer it picked was right) and return a score.

Everything else — CRUD, answer options on `AddQuestion`, auth/ownership — is
already here from Lab 7-9 and doesn't change.

`GITHUB_TOKEN` must be set in the environment before `dotnet run` for
`/quizzes/generate` to work — same token from Lab 1-4, needs the "models"
scope (classic PAT) or the "Models" permission (fine-grained PAT).

## Run it

```bash
# 1. create/upgrade the database from the migrations (LocalDB; Docker fallback below)
dotnet ef database update

# 2. make sure your GitHub Models token is set (same one as Lab 1-4)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 3. run — port is pinned to 5023, same as every lab so far
dotnet run
```

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

The `Dtos/` folder already has `GenerateQuizDto`, `PlayQuizDto`,
`SubmitQuizDto`, and `QuizResultDto` shaped to match — you don't need to
write these, just use them.
