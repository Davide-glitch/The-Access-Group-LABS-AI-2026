# Lab 8 — API (your Lab 7 backend, plus two tweaks)

This is **the same backend** as `Lab7/Solution` — same namespace (`Lab7`),
same models, same auth, same ownership rules. We didn't rename anything;
renaming a namespace wouldn't teach you anything new, and you should
recognize every file in here.

Two things changed, both explained in `../guide.html` step 00 and on the
"Bridging to the backend" slide of the presentation:

1. **CORS** — `Program.cs` now calls `AddCors` / `UseCors()` so a browser
   page served from `http://localhost:5173` (the Vite dev server) is allowed
   to call this API. Without it, every `fetch()` from React fails in the
   browser console before it reaches a controller — that's how CORS works,
   it's enforced client-side.
2. **`GET /quizzes` is temporarily public.** `QuizzesController.List()` now
   has `[AllowAnonymous]`, layered on top of the class-level `[Authorize]`.
   Every other action — `POST`, `PUT`, `DELETE` — is exactly as protected as
   it was in Lab 7. Calling those from the browser today still returns `401`.
   Wiring a real browser sign-in flow (MSAL) is a later session; for now,
   reading is public so the lab can focus on React fundamentals.

## Run it

```bash
# 1. create/upgrade the database from the migrations (LocalDB; Docker fallback below)
dotnet ef database update

# 2. run — port is pinned to 5023, same as Lab 7
dotnet run
```

Open <http://localhost:5023/swagger> and confirm:

- `GET /quizzes` works **without** clicking Authorize — `200`, three seeded quizzes.
- `POST /quizzes` **without** signing in → still `401`. Writes are unchanged.

### Docker fallback (no LocalDB)

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Then point the `QuizzesDb` connection string in `appsettings.json` at:

```
Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=Your_strong_Pass1;TrustServerCertificate=True
```

> Requires the EF CLI once per machine: `dotnet tool install --global dotnet-ef`

## What the React app in `../Code` expects

- The API running at `http://localhost:5023`
- `GET /quizzes` reachable with no `Authorization` header
- A JSON array of objects shaped like:

```json
{ "id": "11111111-...", "title": "C# fundamentals", "description": "...", "ownerId": "00000000-...feed" }
```
