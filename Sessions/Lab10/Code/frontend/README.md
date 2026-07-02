# Lab 10 — frontend (given, not built this session)

This is Lab 9's finished Solution, unchanged. Lab 10's hands-on time goes to
`../backend` — building `POST /quizzes/generate` (as an AI agent),
`GET /quizzes/{id}/play`, and `POST /quizzes/{id}/evaluate`. This app already
calls all three; right now they 404 because the starter backend doesn't
implement them yet.

Run it to *test* your backend work, not to edit it:

```bash
npm install
npm run dev
# → http://localhost:5173
```

The API in [`../backend`](../backend) must be running at
`http://localhost:5023`. Sign in with Microsoft before generating or
creating a quiz — both are writes.

See [`../../Solution/frontend`](../../Solution/frontend) — it's the same app,
included there too so the reference solution is fully self-contained.
