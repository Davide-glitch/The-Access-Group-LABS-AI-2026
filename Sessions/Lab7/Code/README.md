# Lab 7 — Baseline

This is the **starting point** for Lab 7: the completed Lab 6 Quizzes API
(persisted in SQL Server with EF Core, async, with a one-to-many to Questions).
There is **no authentication or authorization yet** — that's the lab.

Work through the steps in [`../guide.html`](../guide.html). Don't use your own
Lab 6 folder — everyone starts from this identical, compiling baseline.

## Prerequisites

- **.NET 10 SDK**
- **EF Core CLI** (once per machine): `dotnet tool install --global dotnet-ef`
- A database — **SQL Server LocalDB** (ships with Visual Studio) is the default.
  No LocalDB? See the Docker fallback below.
- The **three Entra values** your instructor will hand out (client id, scope,
  authority) — you'll need them from step 01 onward.

## Run it

```bash
# 1. create the QuizzesDb database from the existing migrations
dotnet ef database update

# 2. run — the port is pinned to 5023 on purpose (see below)
dotnet run
```

Open <http://localhost:5023/swagger>, run `GET /quizzes`, and confirm you get the
three seeded quizzes.

> **Do not change the port.** The Swagger sign-in redirect URL
> (`http://localhost:5023/swagger/oauth2-redirect.html`) is registered in the
> shared Entra app. A different port breaks sign-in in Part A.

## Docker fallback (no LocalDB)

On Mac/Linux, or if you don't have LocalDB:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_Pass1" \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

Then change the `QuizzesDb` connection string in `appsettings.json` to:

```
Server=localhost,1433;Database=QuizzesDb;User Id=sa;Password=Your_strong_Pass1;TrustServerCertificate=True
```
