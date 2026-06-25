import type { ApiQuiz } from '../types/quiz';

const API_BASE = 'http://localhost:5023';

// The one place this app talks to the real backend. GET /quizzes is
// temporarily AllowAnonymous (see ../../api/README.md), so no Authorization
// header is needed — this is exactly the "fetch data from your API" lesson.
export async function fetchQuizzes(): Promise<ApiQuiz[]> {
  const res = await fetch(`${API_BASE}/quizzes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Writes are still [Authorize]d on the backend (only GET was made public), so
// these send a bearer token. The token is pasted in by the user for now — a
// real browser sign-in (MSAL) is a later session.
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

// POST /quizzes/{id}/questions — adds one question (text only; the backend has
// no concept of answer options). Returns the updated quiz.
export async function addQuestion(
  token: string,
  quizId: string,
  text: string,
): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Add question failed: HTTP ${res.status}`);
  return res.json();
}
