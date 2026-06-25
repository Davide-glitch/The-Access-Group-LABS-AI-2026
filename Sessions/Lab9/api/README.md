# Lab 9 — API (your Lab 8 backend, plus answer options, AI-assisted generation, and grading)

Same backend, same namespace (`Lab7`), same auth and ownership rules as
every lab since Lab 7. This README explains what's new — you don't build any
of this during the session (that's explained in `../guide.html` step 00); the
lab's hands-on time goes to the React side that consumes it.

## What's new for Lab 9

1. **Answer options.** `Question` now has `Options: List<AnswerOption>` —
   each with `Text` and `IsCorrect`. A question can still have zero options
   (Lab 8-style, text only); if it has any, the controller requires at least
   two, with exactly one marked correct. `POST /quizzes/{id}/questions`
   accepts an `options` array now, in addition to `text`.

2. **`POST /quizzes/generate` — AI-assisted generation.** Send a longer
   piece of text (`sourceText`, 200–20,000 chars) and a `questionCount`
   (3–10); `OpenAiQuizGenerator` (a plain chat-completion call to GitHub
   Models with your `GITHUB_TOKEN`, the same token from Lab 1-4) reads it and
   writes a multiple-choice quiz, which gets validated and persisted exactly
   like a manually-built one. `[Authorize]` — it's a write.

3. **`GET /quizzes/{id}/play` — the "no peeking" view.** Returns questions
   and options *without* `IsCorrect`. `[AllowAnonymous]`, same as `List()`.

4. **`POST /quizzes/{id}/evaluate` — server-side grading.** The browser
   posts back `{ answers: [{ questionId, selectedOptionId }] }`; the server
   looks up the real correct option for each question and returns a
   `QuizResultDto` with a score and, now that grading is done, the correct
   answers revealed. `[AllowAnonymous]` — it's a read/compute, not a write.
   Questions with no options at all are skipped — there's nothing to grade.

`GITHUB_TOKEN` must be set in the environment before `dotnet run` for
`/quizzes/generate` to work — it's the same token from Lab 1-4 (a GitHub
personal access token with the "models" scope). Nothing else needs it.

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
- `POST /quizzes/{id}/questions` with two options (one `isCorrect: true`) →
  `200`, the question comes back with its options attached.
- `GET /quizzes/{id}/play` on that quiz → `200`, options but no `isCorrect`.
- `POST /quizzes/{id}/evaluate` with a guess → `200`, a score, and now the
  correct answers are visible in the response.
- `POST /quizzes/generate` (signed in, with `GITHUB_TOKEN` set) with a
  paragraph of text → `201`, a new quiz with AI-written questions.

### Docker fallback (no LocalDB)

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Then point the `QuizzesDb` connection string in `appsettings.Development.json` at:

```
Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=Your_strong_Pass1;TrustServerCertificate=True
```

> Requires the EF CLI once per machine: `dotnet tool install --global dotnet-ef`

## What the React app in `../Code` / `../Solution` expects

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
