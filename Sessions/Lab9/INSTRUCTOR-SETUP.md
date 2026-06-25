# Lab 9 — Instructor setup (do this before the session)

Two new moving parts versus Lab 8: a `GITHUB_TOKEN` the API needs so it can
call a model for quiz generation, and one extra redirect URI on the
existing Entra app registration so the React app can sign students in for
real with MSAL (no *new* app registration — same one the API has trusted
since Lab 7). CORS and the public `GET /quizzes` carry over unchanged.

> ~15 minutes.

---

## 1. Confirm student machines have Node 20 LTS and the .NET SDK

```bash
node -v
dotnet --version
```

Same baseline as every lab since Lab 6/7. If anyone's below Node 20, point
them at the LTS from [nodejs.org](https://nodejs.org) before the session
starts.

## 2. Get a `GITHUB_TOKEN` with the "models" scope

This is the **same token** students have used since Lab 1-4 for GitHub
Models — if your cohort already has one from earlier sessions, it still
works here; nothing new to issue. If you're setting this lab up cold:

1. [github.com/settings/tokens](https://github.com/settings/tokens) → generate a
   classic personal access token with the **`models`** scope.
2. Confirm it works before the session:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
   ```

Make sure every student machine either already has this exported, or knows
to paste their own token before `dotnet run`. **The API starts fine without
it** — only the first call to `POST /quizzes/generate` fails (the quiz
generator is constructed lazily, on first use). That's a good thing to say out loud during
the session, so a missing token reads as "oh, right, forgot to export it,"
not "the lab is broken."

## 3. Add the SPA redirect URI to the existing Entra app registration

Students sign in for real this week via MSAL, in the browser — no *new* app
registration needed, but the **existing** one (Client ID
`5c2ab77a-5cfb-4b0e-aa3c-327f600296e6`, tenant `consumers`, the same one the
API has validated tokens against since Lab 7) needs one more redirect URI on
its **Single-page application** platform.

1. [Entra admin center](https://entra.microsoft.com) → **App registrations**
   → find the app with Client ID `5c2ab77a-5cfb-4b0e-aa3c-327f600296e6` →
   **Authentication**.
2. Under **Platform configurations**, find **Single-page application**. It
   should already list `http://localhost:5023/swagger/oauth2-redirect.html`
   (Swagger's redirect, from Lab 7/8).
3. Add a second redirect URI on that *same* platform entry:
   `http://localhost:5173` (Vite's dev server). Save.

Do this once, before the session — every student signs in against the same
app registration and tenant, so one redirect URI covers the whole cohort.

**Make sure it's under _Single-page application_, not _Web_.** A SPA redirect
uses PKCE/CORS; the same URI registered under the "Web" platform will *not*
work for the browser sign-in and produces the same failures below.

**If sign-in fails, it's almost always this.** The popup is the giveaway:

- The popup opens, reaches Microsoft, then shows
  **`invalid_request: The provided value for the input parameter
  'redirect_uri' is not valid`** (a.k.a. **`AADSTS50011`**, "redirect URI ...
  does not match") → `http://localhost:5173` isn't registered on the SPA
  platform yet (or is registered under "Web" instead). Add it as above.
- The popup is **blank / stuck on `about:blank`** and the button sits on
  "Opening sign-in…" → same root cause; let the popup finish loading and the
  `redirect_uri` message above will appear in it.

This is per-app-registration config, **not** a code or per-machine problem:
once `http://localhost:5173` is on the SPA platform, it covers every student
signing in against this registration. (If you're an instructor testing on a
registration you *don't* own — e.g. a personal machine outside the cohort's
tenant — you'll hit this until the owner adds the URI; the students whose
registration already has it are unaffected.)

## 4. macOS only — give the API a database

Same as Lab 7/8: the default connection string targets **SQL Server
LocalDB**, which is Windows-only. On a Mac the API builds and starts, but
every query throws `PlatformNotSupportedException`.

Run SQL Server in a container instead (Azure SQL Edge, works on Apple
Silicon; Docker Desktop or Rancher Desktop both fine):

```bash
docker run -e "ACCEPT_EULA=1" -e "MSSQL_SA_PASSWORD=LabPass_2026!" \
  -p 1433:1433 --name lab9-sql -d mcr.microsoft.com/azure-sql-edge:latest
```

Point `Lab9/api/appsettings.Development.json` at it (overrides
`appsettings.json` only in Development, so Windows LocalDB stays the
default elsewhere):

```json
{
  "ConnectionStrings": {
    "QuizzesDb": "Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=LabPass_2026!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

The container persists across reboots; just restart it:

```bash
docker start lab9-sql
```

> If `dotnet ef` is "command not found": `export PATH="$PATH:$HOME/.dotnet/tools"`.

## 5. Smoke-test the API baseline

```bash
cd Lab9/api
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
dotnet ef database update
dotnet run
```

At `http://localhost:5023/swagger`, without clicking Authorize:

- `GET /quizzes` → **200**, the three seeded quizzes.
- `GET /quizzes/{id}/play` (any seeded id) → **200**, options with no
  `isCorrect`.
- `POST /quizzes/{id}/evaluate` with a guess for that id → **200**, a score.

Then sign in (Authorize) and confirm:

- `POST /quizzes/{id}/questions` with two options, one `isCorrect: true` →
  **200**, options come back attached.
- `POST /quizzes/generate` with a paragraph of text and `questionCount: 3` →
  **201**, a new quiz with AI-written questions. If this 502s, recheck
  `GITHUB_TOKEN` is actually exported in *this* terminal (a new shell tab
  doesn't inherit it from another).

## 6. Smoke-test the frontend baseline against it

```bash
cd Lab9/Code
npm install
npm run dev
```

Open `http://localhost:5173` — this looks like a **finished Lab 8 app**
(it is). Run `npm run build` in the same folder and expect it to **fail**
with a TypeScript error in `QuizBuilder.tsx` about a missing `isCorrect`
property. That's intentional — guide step 01 explains it, step 03 fixes it
(step 02, in between, is the MSAL sign-in work and doesn't touch this error).
If `npm run dev` also fails (not just `build`), something's wrong with the
copy; `npm run dev` should always work, only `build` is meant to fail here.

## 7. Confirm the `Solution/` runs end to end

```bash
cd Lab9/Solution
npm install
npm run dev
```

With the API running and `GITHUB_TOKEN` set: the app opens on a **dedicated
sign-in page**, not the quiz list — the `Solution` gates the whole app behind
auth, so there's no "browse as a guest" path. Click **Sign in with
Microsoft** — a popup opens, sign in with your own Microsoft account, the
popup closes, and the app replaces the sign-in page on its own (no navigation
to click; the header now reads "Signed in as ..."). (This is the step that
needs the redirect URI from step 3 above.) Then from home, **+ New quiz** →
add a question, mark one answer correct with the radio → **Create quiz** →
**Run** → answer → **Submit for grading** → see a score with correct/incorrect
options highlighted. Separately, **✨ Generate from text** → paste a few
paragraphs (200+ characters) → **Generate quiz** → lands you straight in the
graded-play flow for a quiz nobody typed by hand. Both paths should reach the
same `PlayQuiz` screen. This is the target state students are working toward.

> If you land on the quiz list *without* signing in, you're looking at
> `Lab9/Code` (the starter, where sign-in is a corner button), not
> `Lab9/Solution` — the full-screen sign-in gate is Solution-only.

---

## During the session

Two terminals per student: `Lab9/api` (`dotnet run`, `GITHUB_TOKEN` exported
first) and their copy of `Lab9/Code` (`npm run dev`). Point them at
`guide.html` for the step-by-step; `Lab9/Solution` is the answer key.

Unlike Lab 7, there's no *new* Entra app registration this week — but unlike
Lab 8, auth is no longer a pasted Swagger token: students sign in for real
via MSAL, against the same app registration the API has always trusted (step
3 above just adds the redirect URI it needs). The only new credential to
manage is still `GITHUB_TOKEN`, and most cohorts will already have one from
Lab 1-4.
