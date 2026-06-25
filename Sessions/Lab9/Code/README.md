# Lab 9 — starting point

This is **your finished Lab 8 app** — QuizMaster, fetching from the API and
letting you build and run quizzes in local state. It's your starting point
for Lab 9, not a bare scaffold: the backend endpoints you'll use today are
already linked to this frontend in spirit, you're about to go deeper.

> You'll notice a TypeScript error in `QuizBuilder.tsx` the moment you open
> this project — `src/types/quiz.ts` was updated to give `Answer` an
> `isCorrect` field (the API needs one to grade anything), but the builder
> hasn't been taught to set it yet. That's deliberate, and it's where the
> guide starts. `npm run dev` still works fine — Vite's dev server uses
> esbuild, which strips types without fully type-checking — but
> `npm run build` will fail until you fix it in step 01.

## What's already here

- `ExistingQuizzes` fetching `GET /quizzes` with honest loading/error states.
- `QuizBuilder` building a quiz (title, questions, answer options) in local state.
- `QuizRunner` stepping through a quiz one question at a time, recording picks — **no grading**.
- `ServerQuizDetail` / `QuizCard` for browsing what's on the server.
- All the styling in `src/index.css`.
- `src/types/quiz.ts` — updated for Lab 9, see the comments in the file. New
  shapes (`PlayQuiz`, `QuizResult`, …) are given upfront, same as Lab 8 gave
  you `ApiQuiz`/`Quiz` — you don't have to retype data shapes, you have to
  build the components and logic that use them.
- `src/auth/authConfig.ts` — the MSAL config (Client ID, authority, the one
  scope this app asks for), given upfront the same way the type shapes are —
  there's no lesson in typing out a Client ID. Wiring it into the app is
  today's step 02.
- `@azure/msal-browser` / `@azure/msal-react` in `package.json` — `npm
  install` already pulled them in; nothing to add there.

## What you'll build today

1. **Real sign-in with MSAL** — replace the "paste a bearer token from
   Swagger" field with an actual **Sign in with Microsoft** button, using
   `@azure/msal-browser` / `@azure/msal-react` (already in `package.json`).
2. **Mark a correct answer in `QuizBuilder`** and send options to the API.
3. **`QuizGenerator`** — a new screen: paste in a longer piece of text, call
   `POST /quizzes/generate`, watch a model write you a quiz.
4. **`PlayQuiz`** — a new screen that fetches `GET /quizzes/{id}/play` (no
   correct answers visible), lets the student pick one option per question,
   then `POST`s to `/quizzes/{id}/evaluate` and shows the graded result.
5. Wire it all into `App.tsx`.

Follow [`../guide.html`](../guide.html) — it walks through each piece. `../Solution` is the answer key.

## Run it

```bash
npm install
npm run dev
# → http://localhost:5173
```

The API in [`../api`](../api) must be running at `http://localhost:5023` for
anything beyond the local builder/runner to work — see `../api/README.md`.
