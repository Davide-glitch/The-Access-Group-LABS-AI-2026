# Lab 9 — Facilitator run-sheet

**Topic:** Real sign-in, AI-assisted quizzes & real grading — a model drafts the quiz, the server grades it.
**Outcome:** Students extend their Lab 8 app so a correct answer can be marked, a quiz can be generated from pasted text via a direct call to a model, and playing a quiz produces a real score from the server.

---

## Before students arrive (~15 min) — see `INSTRUCTOR-SETUP.md`
- [ ] `node -v` is 20 LTS; `dotnet --version` checks out.
- [ ] `GITHUB_TOKEN` (the Lab 1-4 one) is ready to export — confirm it actually has the `models` scope.
- [ ] Entra: the existing app registration (`5c2ab77a-5cfb-4b0e-aa3c-327f600296e6`) has `http://localhost:5173` added as a second redirect URI on its Single-page application platform, alongside Swagger's.
- [ ] DB up: `docker start lab9-sql` (macOS); `dotnet ef database update` once.
- [ ] API smoke-test: `cd Lab9/api && dotnet run` → `GET /quizzes` = 200, `POST /quizzes/generate` (signed in) = 201.
- [ ] `Lab9/Code`: `npm install && npm run dev` works; `npm run build` **fails** with the expected `isCorrect` TS error (that's correct, not a setup bug).
- [ ] `Lab9/Solution`: `npm install && npm run dev` works; **Sign in with Microsoft** succeeds, and the full build-mark-run-grade loop and the generate-from-text loop both reach a graded score.

## Materials
- Slides: `lab9-auth-quizzes-and-grading.html` (22 slides) — press **F** for fullscreen, **→/←** to navigate.
- Guide: `guide.html` (steps 00–09) — students follow this in their copy of `Lab9/Code`.
- Answer key: `Lab9/Solution` (don't let them copy it; use to catch up).

---

## Run of show (~2 hours 20 min)

| Time | Segment | What happens |
|------|---------|--------------|
| 0:00 | **Recap & the gaps** (slides 1–4) | Lab 8 had no real sign-in, no AI-assisted generation, and no grading; today fixes all three. |
| 0:10 | **Real auth with MSAL** (slides 5–6) | Replacing a pasted token with a real sign-in popup; same app registration, one more redirect URI. |
| 0:25 | **Generating & validating quizzes** (slides 7–10) | Send text, get a quiz back; why the model's response still gets checked after deserializing; the new endpoints. |
| 0:35 | **The security lesson** (slides 11–15) | Three DTOs, one entity; why grading can't happen client-side. |
| 0:50 | **Frontend pieces** (slides 16–19) | Sign-in button, `QuizGenerator`'s fetch-lifecycle shape, `PlayQuiz`'s three phases, putting it together. |
| 1:00 | **Hands-on: sign in for real with MSAL** (guide 00–02) | Run baselines, wire `MsalProvider` + `getAccessToken`, swap the pasted token for a real **Sign in with Microsoft** button. |
| 1:20 | **Hands-on: mark correct, send options** (guide 03–04) | Fix the TS error, `markCorrect`, send options to the API. |
| 1:40 | **Hands-on: generate** (guide 05) | Build `QuizGenerator`, wire `generateQuiz`. |
| 1:55 | **Hands-on: play & grade** (guide 06–08) | Build `PlayQuiz` (fetch, answer, submit, reveal), wire `App`. |
| 2:10 | **Wrap & homework** (guide 09, slides 20–22) | Recap the gotchas; point at homework. |

Two terminals per student: `Lab9/api` (`dotnet run`, token exported first) and their `Lab9/Code` (`npm run dev`).

---

## Checkpoints (walk the room)

- **After guide 02:** a **Sign in with Microsoft** button appears next to the title; clicking it pops a Microsoft sign-in window, and the header switches to "Signed in as ...". Saving a quiz works with no pasted token anywhere.
- **After guide 03:** `npm run build` is clean again; clicking a radio in the builder unchecks any other radio in the *same* question only.
- **After guide 04:** a saved multiple-choice question shows its options (with `isCorrect`) in `GET /quizzes` via Swagger.
- **After guide 05:** pasting 200+ characters and clicking Generate produces a new quiz in "On the server" — even before `PlayQuiz` exists to play it.
- **After guide 07:** submitting a `PlayQuiz` attempt shows a score banner and color-coded options; reloading and resubmitting still works (no stuck `submitting` state).
- **After guide 08:** the full loop — build or generate → Run → answer → grade — works from both entry points, landing in the same `play` view.

## Common failures → fix

- **Sign-in fails with `AADSTS50011` ("redirect URI ... does not match"):** the app registration is missing `http://localhost:5173` as a redirect URI on its Single-page application platform — see `INSTRUCTOR-SETUP.md` step 3. This is a one-time, shared fix; once it's added, every student's sign-in works.
- **Sign-in popup opens and immediately closes, or never opens:** a browser popup blocker. Tell students to allow popups for `localhost:5173`, or check for a blocked-popup icon in the address bar.
- **`acquireTokenSilent` throws on every call, not just the first:** usually means `setActiveAccount` never ran — check `main.tsx`'s `addEventCallback` on `EventType.LOGIN_SUCCESS` is wired up before anyone signs in.
- **`/quizzes/generate` always 502s:** `GITHUB_TOKEN` not exported in the terminal actually running `dotnet run` — a new tab/pane doesn't inherit another shell's exports.
- **`npm run build` fails in `Code/` before step 03:** expected — that's the deliberate teaching error, not a bug (it's unrelated to the MSAL work in step 02). `npm run dev` should still work fine.
- **Radio marks the wrong question's answer correct, or unmarks an unrelated one:** missing or duplicated `name={`correct-${q.id}`}` — radios without a *per-question* group name compete across the whole form.
- **`PlayQuiz` shows stale data after navigating to a different quiz:** `useEffect` dependency array is `[]` instead of `[quizId]` — without the dependency, it never refetches for a new id.
- **Score always 0% or NaN%:** `selectedOptionId` sent as `undefined` instead of `null` for unanswered questions (the server expects the key to be present), or `evaluateQuiz`'s body isn't wrapped in `{ answers: [...] }`.
- **Generated quiz has questions with 1 or 3 options:** the model ignored its instructions — this is itself a teaching moment, points back to slide 9 (validation) and homework #4. The backend's own validation should turn this into a 502, not a saved bad quiz; if it didn't, check `OpenAiQuizGenerator.GenerateAsync`'s validation loop is intact.

## Scope notes (say these out loud)

- **The backend is pre-built, same as the API has been since Lab 7** — today's hands-on time is 100% frontend, consuming three new endpoints plus real sign-in. Nobody touches `Services/OpenAiQuizGenerator.cs` during the session; it's there to read and discuss (slides 7–10), not to edit.
- **Auth is real this week, not a new app registration.** The bearer token used to be pasted in from Swagger, same as Lab 8 — today MSAL replaces that with an actual Microsoft sign-in popup, against the *same* Entra app registration the API has trusted since Lab 7. Nothing changed on the backend; the only setup delta is the extra redirect URI (`INSTRUCTOR-SETUP.md` step 3).
- **`QuizRunner.tsx` is retired**, replaced by `PlayQuiz.tsx` — if a student asks why their muscle memory from Lab 8 doesn't apply, that's the answer: grading needed a different data flow (fetch the no-peeking shape, submit, get told the result), not just a feature bolted onto the old runner.
