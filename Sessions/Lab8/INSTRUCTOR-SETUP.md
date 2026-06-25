# Lab 8 — Instructor setup (do this before the session)

Much lighter than Lab 7: no new Entra app registration this week. `GET /quizzes`
is temporarily `[AllowAnonymous]`, so students never touch sign-in to see data
flow into the browser — that's deliberately deferred to a later session.

> ~5 minutes.

---

## 1. Confirm student machines have Node 20 LTS

```bash
node -v
```

The most common Lab 8 failure is an old Node version breaking the Vite dev
server with an unhelpful error. If anyone's below Node 20, have them install
the LTS from [nodejs.org](https://nodejs.org) before the session starts.

## 1b. macOS only — give the API a database

The lab's default connection string uses **SQL Server LocalDB**
(`Server=(localdb)\MSSQLLocalDB`), which is **Windows-only**. On a Mac the API
builds and starts but every query throws
`System.PlatformNotSupportedException: LocalDB is not supported on this platform`.

Run SQL Server in a container instead (works on Apple Silicon via Azure SQL
Edge; Docker Desktop or Rancher Desktop both work):

```bash
docker run -e "ACCEPT_EULA=1" -e "MSSQL_SA_PASSWORD=LabPass_2026!" \
  -p 1433:1433 --name lab8-sql -d mcr.microsoft.com/azure-sql-edge:latest
```

Point the API at it via `Lab8/api/appsettings.Development.json` (this overrides
`appsettings.json` only in Development, so the Windows LocalDB default stays
intact):

```json
{
  "ConnectionStrings": {
    "QuizzesDb": "Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=LabPass_2026!;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

The container persists. After a reboot or stopping the engine, just restart it:

```bash
docker start lab8-sql
```

> If `dotnet ef` is "command not found", add the global tools dir to PATH:
> `export PATH="$PATH:$HOME/.dotnet/tools"`.

## 2. Smoke-test the API baseline

```bash
cd Lab8/api
dotnet ef database update
dotnet run
```

- `http://localhost:5023/swagger` → run `GET /quizzes` **without** clicking
  Authorize → expect **200** with the three seeded quizzes.
- `POST /quizzes` without signing in → expect **401** (writes are untouched).

If `GET /quizzes` 401s, the `[AllowAnonymous]` attribute on `List()` in
`Controllers/QuizzesController.cs` didn't make it into this copy — check it's
still there.

## 3. Smoke-test the frontend baseline against it

```bash
cd Lab8/Code
npm install
npm run dev
```

Open `http://localhost:5173`. `Code/` is now a **bare scaffold** — you should
see the "QuizMaster" header and a single "nothing here yet" placeholder. It
makes **no API call** at this stage (students add `fetchQuizzes` in the guide),
so there's nothing to CORS-fail yet — the API doesn't even need to be running
for this baseline to look right.

## 4. Confirm the Solution/ runs end to end

```bash
cd Lab8/Solution
npm install
npm run dev
```

With the API running you should see, under **"On the server"**, the three
seeded quizzes; stop the API and reload — that section shows an error message,
not a blank page or an infinite spinner. Above it, **"Your quizzes"** starts
empty: click **"+ New quiz"**, add a couple of questions and answer options,
**Create quiz**, then **Run** it and step through. That whole build-and-run
flow is local React state — it never hits the API. This is the target state
students are working toward.

---

## During the session

Two terminals per student: one for `Lab8/api` (`dotnet run`), one for their
copy of `Lab8/Code` (`npm run dev`). Point them at `guide.html` for the
step-by-step. `Lab8/Solution` is the answer key if anyone falls behind.

No client IDs, scopes, or redirect URIs to hand out this week.
