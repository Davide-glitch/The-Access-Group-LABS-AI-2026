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
