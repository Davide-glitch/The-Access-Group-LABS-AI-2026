# Lab 8 — Solution

The **completed** project: the `Code/` baseline after every step of
`../guide.html` has been applied. Use it to check your work or to catch up if
you fall behind.

> Don't copy this folder to follow the lab — work through the guide in
> `Code/`. This is the reference answer.

## What it does

**QuizMaster** has two halves:

1. **Fetch from the API.** `ExistingQuizzes` calls `GET /quizzes` and lists
   the quizzes already on the server, with honest loading / error / empty
   states. This is the "fetch data" lesson.
2. **Build and run your own.** `QuizBuilder` creates a quiz in React state —
   title, questions, and answer options per question — and `QuizRunner` steps
   through it one question at a time. All of this lives in the browser; nothing
   is POSTed (the API's write endpoints need sign-in, a later session).

There are **no correct answers** — running a quiz records your picks and shows
a summary, it doesn't grade. That was a deliberate scope choice.

## What's different from `Code/`

- **`src/api/quizzes.ts`** — `fetchQuizzes()` calls `GET /quizzes`, throws on a
  non-`ok` response, returns the parsed JSON.
- **`src/components/ExistingQuizzes.tsx`** — `useState` for the data plus
  `loading`/`error`; a `useEffect` with an empty dependency array fetches once
  on mount; `.finally()` always clears `loading`.
- **`src/components/QuizBuilder.tsx`** — `title` + `questions` state, with
  immutable add/remove/update handlers for questions and their answers.
- **`src/components/QuizRunner.tsx`** — `current` question index, a
  `questionId → answerId` picks map, and a `finished` flag with a summary
  screen.
- **`src/App.tsx`** — owns the list of built quizzes (lifted state) and a tiny
  `view` state machine that switches between home / build / run.

`QuizCard`, the types and the CSS are shared with `Code/`.

## Run it

```bash
npm install
npm run dev
# → http://localhost:5173
```

The API in [`../api`](../api) at `http://localhost:5023` only needs to be
running for the "On the server" list. The builder and runner work on their
own. With the API up you'll see the three seeded quizzes; stop it and reload
and that section shows an error message instead of a blank page.
