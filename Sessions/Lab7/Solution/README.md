# Lab 7 — Solution

The **completed** project: the `Code/` baseline after every step of `../guide.html`
has been applied. Use it to check your work or to catch up if you fall behind.

> Don't copy this folder to follow the lab — work through the guide in `Code/`.
> This is the reference answer.

## What's different from `Code/`

- **`Microsoft.Identity.Web`** (4.10.0) — validates Microsoft-issued bearer tokens
- `appsettings.json` has an **`AzureAd`** section (`consumers` audience)
- `Program.cs` — `AddMicrosoftIdentityWebApi`, `UseAuthentication`/`UseAuthorization`,
  and Swagger configured for the OAuth2 auth-code + PKCE sign-in flow
- `QuizzesController` is `[Authorize]`d; `Create` stamps the owner's `oid`;
  `Replace`/`Delete` enforce **owner-only** with an inline check (`403` otherwise)
- `Models/Quiz.cs` gains `OwnerId`; the seed quizzes are owned by a fixed
  "house" id (`...feed`) that no student matches
- `Migrations/` — adds `AddQuizOwner`

## Configuration

This solution is wired to a real app registration (client id
`5c2ab77a-5cfb-4b0e-aa3c-327f600296e6`, `consumers` audience). A client id is a
public identifier, not a secret — there is no client secret anywhere (Swagger
uses PKCE). To point it at a different registration, change the `ClientId` in
`appsettings.json` and the `clientId` constant in `Program.cs`.

## Run it

```bash
# 1. create/upgrade the database from the migrations (LocalDB; see Code/README.md for Docker)
dotnet ef database update

# 2. run
dotnet run
```

Open <http://localhost:5023/swagger>:

1. `GET /quizzes` **without** signing in → **401**.
2. Click **Authorize**, sign in with a personal Microsoft account, accept consent.
3. `GET /quizzes` → **200**.
4. `POST /quizzes`, then `PUT` your own quiz → **204** (you own it).
5. `PUT`/`DELETE` a seeded quiz (`11111111-1111-1111-1111-111111111111`) → **403**
   (owned by the house, not you).

> Requires the EF CLI once per machine: `dotnet tool install --global dotnet-ef`
