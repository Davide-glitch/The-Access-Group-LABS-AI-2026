# Lab 6 — Solution

The **completed** project: the `Code/` baseline after every step of `../guide.html`
has been applied. Use it to check your work or to catch up if you fall behind.

> Don't copy this folder to follow the lab — work through the guide in `Code/`.
> This is the reference answer.

## What's different from `Code/`

- **EF Core + SQL Server** via `Microsoft.EntityFrameworkCore.SqlServer` (see `Lab6.csproj`)
- `Data/QuizzesDbContext.cs` — the DbContext, `DbSet`s, and seed data
- `Repositories/EfQuizRepository.cs` — replaces the deleted `InMemoryQuizRepository`
- `IQuizRepository` and `QuizzesController` are now **async**
- `Models/Question.cs` + `Quiz.Questions` — a one-to-many relationship
- `Dtos/CreateQuestionDto.cs` and a `POST /quizzes/{id}/questions` endpoint
- `Migrations/` — `InitialCreate` (Quizzes) and `AddQuestions` (Questions + FK)
- `Program.cs` registers the DbContext and the EF repository (`AddScoped`)

## Run it

```bash
# 1. create the database from the migrations (LocalDB; see Code/README.md for Docker)
dotnet ef database update

# 2. run
dotnet run
```

Open <http://localhost:5023/swagger>. Create a quiz, add a question with
`POST /quizzes/{id}/questions`, then **restart the app** — the data is still
there, because it lives in SQL Server.

> Requires the EF CLI once per machine: `dotnet tool install --global dotnet-ef`
