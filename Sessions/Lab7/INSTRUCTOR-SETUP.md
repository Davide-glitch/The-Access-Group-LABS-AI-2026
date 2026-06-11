# Lab 7 — Instructor setup (do this before the session)

Students authenticate against **one shared Microsoft Entra app registration** you
create once. They never touch the Entra portal. This note is the reproducible
recipe for that registration, plus the three values you hand out.

> ~15 minutes. You need any Microsoft account that can create an app registration
> in the [Entra portal](https://entra.microsoft.com) (free personal tenant is fine).

---

## 1. Create the app registration

**Entra portal → App registrations → New registration**

- **Name:** `AC Labs 2026 — Lab 7 Quizzes API` (any name)
- **Supported account types:** **Personal Microsoft accounts only**
  - This is the `consumers` audience — students sign in with `outlook.com` /
    `hotmail.com` accounts, no work account or admin consent needed.
- **Redirect URI:** leave blank for now → **Register**

Copy the **Application (client) ID** from the overview page — this is the
`client id` you'll distribute.

## 2. Add the Swagger redirect URI (as a SPA)

**Authentication → Add a platform → Single-page application**

- **Redirect URI:** `http://localhost:5023/swagger/oauth2-redirect.html`
  - `http://localhost` is allowed by Entra (loopback exception) — no HTTPS needed.
  - The port **must** be `5023`; the baseline is pinned to it.
- Save. (SPA + PKCE means **no client secret** — don't create one.)

## 3. Expose the API scope

**Expose an API → Add a scope**

- Accept the default **Application ID URI** `api://<client-id>` → Save and continue.
- **Scope name:** `access_as_user`
- **Who can consent:** **Admins and users**
- **Admin/user consent display name + description:** "Access the Quizzes API as you"
- **State:** Enabled → **Add scope**

The full scope string is `api://<client-id>/access_as_user` — the `scope` value
you'll distribute.

## 4. Confirm v2 tokens

**Manifest** → check `"accessTokenAcceptedVersion": 2` (it should already be 2 for
a `consumers` app). This makes the audience the client-id GUID, which
`Microsoft.Identity.Web` validates out of the box.

---

## The three values to hand out

| Value | What to give students |
|---|---|
| **Client ID** | the Application (client) ID GUID from step 1 |
| **Scope** | `api://<client-id>/access_as_user` |
| **Authority** | `https://login.microsoftonline.com/consumers` (constant) |

Students paste the client id into `appsettings.json` (step 01) and into the
Swagger config (step 04). Nothing secret is distributed.

---

## Smoke test before the session

Run the **completed solution** (or a finished baseline) once and confirm the
end-to-end flow works against your registration:

1. `dotnet run`, open `http://localhost:5023/swagger`.
2. Click **Authorize**, sign in with a personal Microsoft account, accept consent.
3. `GET /quizzes` returns **200**.
4. `POST /quizzes` then `PUT` your own quiz → **204**; `PUT` a seeded quiz
   (`11111111-1111-1111-1111-111111111111`) → **403**.

If sign-in fails, the usual culprits are: redirect URI typo/port mismatch,
account type not set to personal accounts, or the scope not enabled.
