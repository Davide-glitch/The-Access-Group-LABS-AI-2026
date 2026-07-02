import type { ApiQuiz, PlayQuiz, QuizResult } from '../types/quiz';

const API_BASE = 'http://localhost:5023';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchQuizzes(): Promise<ApiQuiz[]> {
  const res = await fetch(`${API_BASE}/quizzes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createQuiz(token: string, input: { title: string }): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create quiz failed: HTTP ${res.status}`);
  return res.json();
}

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
    if (res.status === 502) throw new Error('Quiz generation failed — check the API logs / GITHUB_TOKEN.');
    throw new Error(`Generate quiz failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPlayQuiz(quizId: string): Promise<PlayQuiz> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/play`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

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