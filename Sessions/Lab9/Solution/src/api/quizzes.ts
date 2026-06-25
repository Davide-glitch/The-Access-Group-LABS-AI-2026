import type { ApiQuiz, PlayQuiz, QuizResult } from '../types/quiz';

const API_BASE = 'http://localhost:5023';

// The one place this app talks to the real backend. GET /quizzes is
// temporarily AllowAnonymous (see ../../api/README.md), so no Authorization
// header is needed — this is exactly the "fetch data from your API" lesson.
export async function fetchQuizzes(): Promise<ApiQuiz[]> {
  const res = await fetch(`${API_BASE}/quizzes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Writes are still [Authorize]d on the backend (only reads were made
// public), so these send a bearer token. NEW for Lab 9: that token now comes
// from a real Microsoft sign-in via MSAL (see App.tsx's getAccessToken),
// not a pasted string — this function doesn't know or care which, it just
// needs a token to put in the header.
function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// POST /quizzes — creates the quiz (title + description) and returns it with a
// server-assigned id we then hang questions off of.
export async function createQuiz(
  token: string,
  input: { title: string; description?: string },
): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create quiz failed: HTTP ${res.status}`);
  return res.json();
}

// POST /quizzes/{id}/questions — adds one question. NEW for Lab 9: options
// travel with it now, so the question can actually be graded later.
export async function addQuestion(
  token: string,
  quizId: string,
  text: string,
  options: { text: string; isCorrect: boolean }[] = [],
): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text, options }),
  });
  if (!res.ok) throw new Error(`Add question failed: HTTP ${res.status}`);
  return res.json();
}

// NEW for Lab 9 — POST /quizzes/generate. Hands a longer piece of text to
// the backend, which asks a model to write it into a brand-new, fully built
// quiz. A write, so it needs a token just like createQuiz.
export async function generateQuiz(
  token: string,
  input: { sourceText: string; title?: string; questionCount?: number },
): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes/generate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // 502 here means the model's response itself misbehaved (bad GITHUB_TOKEN,
    // model returned something malformed) — worth a clearer message than "HTTP 502".
    if (res.status === 502) throw new Error('Quiz generation failed — check the API logs / GITHUB_TOKEN.');
    throw new Error(`Generate quiz failed: HTTP ${res.status}`);
  }
  return res.json();
}

// NEW for Lab 9 — GET /quizzes/{id}/play. The "no peeking" shape: questions
// and options, no isCorrect anywhere in the response. AllowAnonymous, like
// fetchQuizzes.
export async function fetchPlayQuiz(quizId: string): Promise<PlayQuiz> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/play`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// NEW for Lab 9 — POST /quizzes/{id}/evaluate. Sends back the picks, gets
// back a graded result (with correct answers revealed). AllowAnonymous —
// grading is a read/compute, not a write, so no token needed.
export async function evaluateQuiz(
  quizId: string,
  answers: { questionId: string; selectedOptionId: string | null }[],
): Promise<QuizResult> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`Evaluate failed: HTTP ${res.status}`);
  return res.json();
}
