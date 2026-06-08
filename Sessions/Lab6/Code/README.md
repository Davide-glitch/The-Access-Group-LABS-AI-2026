# Lab 6 — Baseline project

This is the **starting point for Lab 6**. It is a clean, working copy of the
Quizzes CRUD API exactly as it should look at the end of Lab 5 — **Quiz CRUD
only, backed by an in-memory store. No Questions, no database yet.**

> **Everyone starts from this folder — do _not_ use your own Lab 5 project.**
> This guarantees we're all on identical, compiling code before we touch
> EF Core. If your Lab 5 code drifted or you didn't finish the homework, it
> does not matter — none of it is needed here.

## Step 0 — sanity check (do this before the lab starts)

```bash
dotnet run
```

Then open <http://localhost:5023/swagger>. You should see the **Quizzes**
section with `GET/POST/PUT/DELETE`. Hit `GET /quizzes` → three seeded quizzes
come back. That's the baseline working. Stop the app (`Ctrl+C`) and wait for
the walkthrough.

## What's here

```
Models/Quiz.cs                         the domain model
Repositories/IQuizRepository.cs        the abstraction the controller depends on
Repositories/InMemoryQuizRepository.cs  the current (volatile) implementation
Dtos/CreateQuizDto.cs, UpdateQuizDto.cs input contracts + validation
Controllers/QuizzesController.cs        the REST endpoints
Program.cs                             DI + middleware wiring
appsettings.json                       includes the SQL Server connection string (unused until the lab)
```

The whole point of Lab 6: the controller only knows `IQuizRepository`. We'll
add a SQL Server-backed implementation and swap **one line** in `Program.cs`.

## Database — what you need installed

- **Primary: SQL Server LocalDB** (ships with Visual Studio / the "Data
  storage and processing" workload, or the standalone SQL Server Express
  installer). The connection string in `appsettings.json` already points at
  `(localdb)\MSSQLLocalDB`.
- **Fallback: SQL Server in Docker** (Mac/Linux, or no LocalDB). Run:

  ```bash
  docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_password123" \
    -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
  ```

  Then change the `QuizzesDb` connection string in `appsettings.json` to:

  ```
  Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True
  ```

Inspect the database during the lab with **SQL Server Management Studio (SSMS)**
or **Azure Data Studio**.
