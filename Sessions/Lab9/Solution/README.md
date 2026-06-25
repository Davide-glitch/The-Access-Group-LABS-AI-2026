# Lab 9 — Solution

The **completed** project: the `Code/` baseline after every step of
`../guide.html` has been applied. Use it to check your work or to catch up if
you fall behind.

> Don't copy this folder to follow the lab — work through the guide in
> `Code/`. This is the reference answer.

## What it does

**QuizMaster** now signs you in for real, grades itself, and can write its
own quizzes:

1. **Real sign-in.** `App.tsx` wraps the app in `MsalProvider` (see
   `main.tsx`) and replaces the old "paste a bearer token" field with a
   **Sign in with Microsoft** button. `getAccessToken()` calls
   `acquireTokenSilent` for a fresh token right before every authorized
   call, falling back to a popup only when MSAL genuinely needs the user's
   attention (`InteractionRequiredAuthError`).
2. **Mark a correct answer.** `QuizBuilder` adds a radio next to each answer
   option — `markCorrect(questionId, answerId)` sets that option's
   `isCorrect` and clears every sibling in the same question, so there's
   always at most one. `save()` validates this client-side before it ever
   calls the API: a question is either text-only (zero options) or a real
   gradable question (2+ options, exactly one correct) — the same rule the
   backend enforces, checked here first for a friendlier error message.
3. **Generate a quiz from text.** `QuizGenerator` is a new screen: paste in
   at least 200 characters of source text, optionally a title and a question
   count (3–10), and `POST /quizzes/generate` hands it to the backend, which
   asks a model to read the text and write back a fully-formed quiz —
   questions, options, and the correct answer already marked.
4. **Play and get graded.** `PlayQuiz` replaces the old `QuizRunner`. It
   fetches `GET /quizzes/{id}/play` — a "no peeking" shape with no
   `isCorrect` anywhere in the response — lets you pick one option per
   question, then `POST`s your picks to `/quizzes/{id}/evaluate`. The
   *server* grades them and sends back which were right, which is what
   `PlayQuiz` renders: a score banner plus every option color-coded
   (`option-correct` / `option-incorrect` / `option-selected`).

Because `QuizBuilder.save()` already persists every question (with its
options) to the server, a quiz built by hand and a quiz generated from text
end up as the same kind of row — there's no separate "local-only" runner
left. `App.tsx` has one `play` view, backed by `PlayQuiz`, used for both.

## What's different from `Code/`

- **`src/main.tsx`** — wraps `<App />` in `MsalProvider`, backed by a
  `PublicClientApplication` built from `src/auth/authConfig.ts`.
- **`src/api/quizzes.ts`** — `addQuestion()` now sends `options` alongside
  `text`. Three new functions: `generateQuiz()` (POST `/quizzes/generate`,
  with a clearer message on a 502 from generation failing), `fetchPlayQuiz()` (GET
  `/quizzes/{id}/play`), `evaluateQuiz()` (POST `/quizzes/{id}/evaluate`).
- **`src/components/QuizBuilder.tsx`** — `markCorrect()`, a radio per answer
  row, the pre-flight options validation described above, and the
  `isAuthenticated`/`getToken` props instead of `token`/`onTokenChange`.
- **`src/components/QuizGenerator.tsx`** *(new)* — source text / title /
  question count form, `isAuthenticated`/`getToken` instead of a token
  field; the request lifecycle is idle → generating → done or error, same
  shape as `ExistingQuizzes`'s fetch states, just for a `POST`.
- **`src/components/PlayQuiz.tsx`** *(new)* — fetches the play shape, steps
  through questions, submits for grading, renders the graded result.
  Replaces `QuizRunner.tsx`, which is no longer wired into the app (renamed
  to `QuizRunner.tsx.bak` rather than deleted, so nothing imports it but
  nothing is lost either — see the note below).
- **`src/components/ServerQuizDetail.tsx`** — `onRun` now leads to the same
  `play` view as everything else.
- **`src/main.tsx`** / **`src/App.tsx`** — `MsalProvider` wraps the app;
  `view` gains a `generate` screen and a single `play` screen
  (`{ name: 'play', quizId }`); `run` and `run-server` are gone; no more
  `token` state or `localStorage` — `useMsal()`/`useIsAuthenticated()` drive
  a sign-in/sign-out control in the header, and `getAccessToken()` is passed
  down instead of a raw token string.
- **`src/auth/authConfig.ts`** *(new)* — the MSAL config and the API's
  `access_as_user` scope.
- **`src/index.css`** — `.auth-status`, `.answer-correct-toggle`,
  `.option-correct`, `.option-incorrect`, `.score-banner`, and `textarea`
  styling, on top of what `Code/` already had.

`QuizCard`, `ExistingQuizzes`, and `src/types/quiz.ts` are shared with
`Code/` — already updated there for the new shapes.

> **About `QuizRunner.tsx.bak`:** this sandbox couldn't delete the file
> outright (a filesystem permissions quirk, not a code reason), so it was
> renamed instead. `.bak` isn't a recognized extension, so Vite/TypeScript
> ignore it — it's dead weight, not dead code that runs. Feel free to delete
> it for real once you have the project on a normal filesystem.

## Run it

```bash
npm install
npm run dev
# → http://localhost:5173
```

The API in [`../api`](../api) must be running at `http://localhost:5023` —
unlike Lab 8, almost everything here (building, generating, playing) is a
real round trip to the server now. Set `GITHUB_TOKEN` before starting the API
or the "Generate from text" screen will fail with a 502 — see
`../api/README.md`. Click **Sign in with Microsoft** before trying to create
or generate a quiz — both are writes, and there's no token field to paste
into anymore.
