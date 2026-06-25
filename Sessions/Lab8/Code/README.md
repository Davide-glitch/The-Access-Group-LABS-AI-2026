# Lab 8 — Baseline

The **starting point** for Lab 8: a bare Vite + React + TypeScript project,
scaffolded with `npm create vite@latest -- --template react-ts` and trimmed to
the minimum.

You're building **QuizMaster**: an app that (1) fetches the existing quizzes
from your API and lists them, and (2) lets you build your own quizzes in the
browser — add questions, add answer options — and run through them.

This folder gives you only the scaffold. You create everything else by
following [`../guide.html`](../guide.html):

- `src/api/quizzes.ts` — `fetchQuizzes()` (you'll create this)
- `src/components/QuizCard.tsx` — presentational card
- `src/components/ExistingQuizzes.tsx` — fetch + loading/error + render
- `src/components/QuizBuilder.tsx` — the question/answer editor
- `src/components/QuizRunner.tsx` — step through a quiz
- and you'll wire them together in `src/App.tsx`

## What's already here

```
src/
  App.tsx            placeholder — renders the header + a "nothing here yet" note
  main.tsx           React entry point
  index.css          all the styling you'll need (class names used by the guide)
  types/quiz.ts      ApiQuiz + Quiz/Question/Answer types — given, so you don't
                     have to retype them
```

The `api/` and `components/` folders don't exist yet — you'll add them.

## Prerequisites

- **Node.js 20 LTS** — run `node -v` first. An old Node version is the most
  common reason a fresh Vite project fails to start.
- The API in [`../api`](../api) running at `http://localhost:5023` — see that
  folder's README. Only the "fetch from the API" part needs it; the builder
  and runner work without it.

## Run it

```bash
npm install
npm run dev
# → http://localhost:5173
```

You should see "QuizMaster" and a placeholder message. As you create
components and render them from `App`, the page fills in.

## What "run a quiz" means here

There are **no correct answers** in this app — running a quiz steps through
the questions, lets you pick an option for each, and shows a summary of your
picks at the end. No scoring, by design.
