# Real Sign-In, AI-Assisted Quizzes, Real Grading

*Lab 9 theory — QuizMaster gets a real sign-in button, asks a model to draft
a quiz, and finally decides — for real — what's correct.*

> Each `##` heading below is one slide. Markdown, not HTML or PowerPoint —
> present straight from a rendered Markdown view, or read it like a short
> paper. Either works; the content is what matters.

---

## What we'll cover today

- Where Lab 8 left off, and the three gaps it left open.
- Real sign-in: replacing a pasted bearer token with an actual Microsoft
  sign-in popup (MSAL).
- Sending a block of text to an API endpoint and getting a quiz back.
- Why we validate that quiz ourselves, every time, no matter how it was
  written.
- Why the server grades the quiz, never the browser.
- The frontend pieces: sign-in, `QuizGenerator`, and `PlayQuiz`.

---

## Recap: where Lab 8 left off

`QuizMaster` could fetch quizzes from the API, and build and run a quiz
**entirely in the browser**: a title, some questions, some answer options,
all living in React state. Three honest limitations, on purpose, all three
addressed today:

1. Signing in meant pasting a bearer token copied out of Swagger — nothing
   like how a real app signs someone in.
2. Writing every question by hand doesn't scale past a handful of quizzes.
3. "Running" a quiz with no concept of correctness isn't really a quiz —
   `Answer` didn't even have an `isCorrect` field yet.

---

## Gap one: a pasted token isn't sign-in

Copy-pasting a bearer token out of Swagger was always a teaching shortcut,
not a real auth flow. It only worked because *you* had Swagger open next to
the app. A real user never sees a token, never opens a developer tool, and
shouldn't have to — they expect a button that says **Sign in**.

That's what changes first today: a real Microsoft sign-in popup, via MSAL,
replaces every place the app used to ask for a pasted token.

---

## Real auth: MSAL replaces the paste

```typescript
const { instance, accounts } = useMsal();

async function getAccessToken() {
  const account = accounts[0];
  try {
    const result = await instance.acquireTokenSilent({ ...loginRequest, account });
    return result.accessToken;
  } catch {
    const result = await instance.acquireTokenPopup(loginRequest);
    return result.accessToken;
  }
}
```

`acquireTokenSilent` first — reuse a cached token with no UI at all — and
only fall back to a popup if that fails (first sign-in, expired session).
Every fetch that used to read a pasted `token` from React state now calls
`getAccessToken()` instead. The component tree never sees a raw token string
typed in by a human.

---

## Same app registration, just one more redirect URI

No *new* Entra app registration this week — the React app signs in against
the **same** app registration the API has trusted since Lab 7. The only
setup change is a second redirect URI on that registration's
Single-page-application platform (`http://localhost:5173`, alongside
Swagger's existing one), so the browser's sign-in popup has somewhere to
land. One shared identity, two front doors: Swagger for testing, the React
app for real use.

---

## Gap two: writing quizzes by hand doesn't scale

Imagine you're a teacher with a 2,000-word reading on photosynthesis and you
want a 6-question check for understanding. Typing that by hand is mechanical
work: reread the text, extract facts, phrase a question, write three
plausible wrong answers, repeat six times.

The source material is right there, and the output shape (question +
options + one correct answer) is rigid and checkable — exactly the kind of
task a language model is good at, and exactly the opening today's lab walks
through.

---

## Send the text, get a quiz back

`POST /quizzes/generate` takes a longer piece of pasted text and a
`questionCount`, and returns a brand-new quiz — persisted exactly like one a
student built by hand in `QuizBuilder`: same database table, same
`AddQuestionAsync`, same validation rules. Under the hood it's nothing more
exotic than a chat request with instructions and a JSON shape to fill in:

```csharp
var messages = new List<ChatMessage> {
    new SystemChatMessage("Turn source text into a multiple-choice quiz. " +
        "Every question needs exactly four options, exactly one isCorrect."),
    new UserChatMessage(prompt),
};

var completion = await chatClient.CompleteChatAsync(messages, new ChatCompletionOptions {
    ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat("quiz", quizSchema)
});
```

One instruction string, one JSON schema, one call. No multi-step planning,
no memory between calls, no tools — read the text once, write the quiz once.

---

## Validate everything that comes back

Asking for JSON in a fixed shape is a strong nudge, not a guarantee — a
model can still return a question with one option, or two marked correct.
So the response gets checked before anything is saved, exactly like any
other input you don't control:

```csharp
foreach (var q in payload.Questions)
{
    if (q.Options.Count < 2 || q.Options.Count(o => o.IsCorrect) != 1)
        throw new InvalidOperationException(
            $"The model returned a malformed question (\"{q.Text}\"): " +
            "needs 2+ options and exactly one marked correct.");
}
```

A bad response becomes a `502` to the caller, not a broken quiz silently
saved to the database. Asking nicely for a shape doesn't remove the need to
check it landed.

---

## New backend endpoints, at a glance

| Endpoint | Auth | Job |
|---|---|---|
| `POST /quizzes/generate` | required | source text in → model drafts the quiz → checked → saved, same as a hand-built one |
| `GET /quizzes/{id}/play` | public | the no-peeking shape — questions and options, **no** `isCorrect` |
| `POST /quizzes/{id}/evaluate` | public | submitted picks in → server grades → result with `isCorrect` revealed |

Generating is a write (it creates rows), so it's `[Authorize]`d like
`POST /quizzes` always has been — the same sign-in from earlier in this
deck is what makes that header real now, not pasted. Playing and evaluating
are reads/computes over data the server already owns — public, even though
one of them is a `POST`.

---

## The security lesson: who can be trusted with "this is correct"?

Here's the question this whole lab is really about: once a quiz has a
correct answer, **where is it safe to say so out loud?**

- In the database: fine — that's the source of truth.
- In a response to whoever's *building or owning* the quiz: fine — they're
  allowed to know what they wrote.
- In a response to whoever's *about to take* the quiz: **not fine.** Open
  the browser's network tab and there it is, before they've answered a
  single question.

A client-submitted "I got this right" flag is exactly as trustworthy as
asking a student to grade their own exam and just believing them. The fix is
never sending the answer key to a client that hasn't earned it yet.

---

## Three views of the same `Quiz`, three different DTOs

| DTO | Used by | Has `IsCorrect`? |
|---|---|---|
| `Quiz` (full entity) | the owner's "On the server" list | yes |
| `PlayQuizDto` | a student about to answer | **no** |
| `QuizResultDto` | a student who already submitted | yes — *now* it's safe |

Same underlying rows, three shapes, because three different people (or the
same person at three different moments) are allowed to know three different
amounts. **A view model is a trust boundary, not just a data-shaping
convenience.**

---

## Why `GET /play` strips `isCorrect`

```csharp
Options = q.Options.Select(o => new PlayOptionDto { Id = o.Id, Text = o.Text }).ToList()
```

`PlayOptionDto` simply doesn't *have* an `IsCorrect` property — there's no
flag being set to `false` or hidden in the frontend, because that would
still mean the correct answer made it into the HTTP response somewhere, and
anyone can open dev tools. The guarantee is structural, not behavioral: the
type itself cannot carry the answer.

---

## Why grading happens on the server, not the client

`PlayQuiz` never has the correct answers, so it *cannot* grade locally — and
that's not a missing feature, that's the design working as intended. The
client's only job is to remember which option the student clicked and ship
that to `POST /quizzes/{id}/evaluate`. The server looks up the real
`Question.Options`, finds the one where `IsCorrect`, and compares.

A nice side effect: the grading logic exists in exactly one place
(`QuizzesController.Evaluate`), not duplicated between a "preview" client
calculation and a server-side double-check. One source of truth for what
"correct" means.

---

## Defense in depth: client validation mirrors server validation

The server rejects a question with one option, or with zero-or-two-plus
correct answers. So does `QuizBuilder.save()`, *before* the request is even
sent:

```typescript
if (q.answers.filter((a) => a.isCorrect).length !== 1) {
  setWarning(`Mark exactly one correct answer for "${q.text}".`);
  return;
}
```

This is not redundant. The server check is the one that actually matters for
security — never trust a request just because it came from "your own"
frontend. The client check exists purely for *experience*: a specific,
friendly message instead of a generic failed request, the instant a mistake
is made rather than after a round trip.

---

## Frontend: signing in for real

A **Sign in with Microsoft** button next to the title, wired to
`instance.loginPopup()`. Once signed in, `getAccessToken()` (a few slides
back) backs every write — `Create`, `AddQuestion`, `Generate` — with a real
token, and the header reads "Signed in as ...". No component below `App`
ever stores or passes a token string by hand anymore; they ask for one when
they need it.

---

## Frontend: `QuizGenerator` — a familiar shape, a new trigger

`QuizGenerator` has no "build it yourself" state at all — no nested question
arrays, no immutable updates. It has exactly the same three states as
`ExistingQuizzes`'s data fetch (idle → in flight → done or error), just
triggered by a click instead of mount, and a `POST` instead of a `GET`. If
you've internalized the fetch lifecycle from Lab 8, you already know this
component; only the trigger — and the text box it sends — changed.

---

## Frontend: `PlayQuiz` — answer, then submit, then reveal

Three phases, one component:

1. **Fetch** the play shape on mount (`useEffect`, keyed on `quizId` this
   time — a different quiz id should mean a fresh fetch).
2. **Answer**, one question at a time, recorded in a `questionId → optionId`
   map — nothing sent anywhere yet.
3. **Submit** the whole map at once, and let `result` (once it exists) take
   over the render entirely — the graded view and the answering view are
   mutually exclusive, driven by one piece of state.

---

## Putting it together: one `play` view in `App`

Lab 8 had `run` (a local quiz) and `run-server` (a quiz fetched from the
API) as two separate views feeding two different shapes into `QuizRunner`.
Today they collapse into one `play` view, because by the time
`QuizBuilder.save()` returns, a "local" quiz and a "server" quiz are the
exact same row in the database. `PlayQuiz` only ever needs an `id` — it goes
and fetches the no-peeking shape itself, regardless of whether that quiz was
typed by hand or generated from pasted text five seconds ago.

---

## Things people get wrong on day one

- **Sign-in popup blocked or `AADSTS50011`** — a browser popup blocker, or
  the redirect URI from earlier in this deck hasn't been added to the app
  registration yet.
- Forgetting `GITHUB_TOKEN` before starting the API — the server still
  boots fine; only the *first* `/generate` call fails, which can look like a
  routing bug if you don't know to check for it.
- Treating a `502` from `/generate` like any other failed request — it means
  the model's response didn't pass validation, not that the request itself
  was malformed.
- Putting `isCorrect` checks in the frontend and assuming that's "secure" —
  it's a UX nicety; the server check is the only one an attacker can't skip.
- Forgetting the `name={`correct-${q.id}`}` on the radio inputs — without a
  per-question group name, marking one question's answer correct un-marks
  every other question's answer too.

---

## What you can do now

- Explain, in one sentence, why a pasted bearer token isn't the same thing
  as signing in.
- Explain, in one sentence, why `PlayQuizDto` has no `IsCorrect` field.
- Trace a generated quiz from a pasted paragraph all the way to a graded
  result, naming every endpoint it touches along the way.
- Build a new endpoint that returns a *different* view of an existing
  entity, deliberately omitting a field a particular caller shouldn't see.
- Ask a model for a JSON-shaped response, and explain why you'd still
  validate it after deserialization succeeds.

## Questions?
