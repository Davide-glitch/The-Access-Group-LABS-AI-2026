import type { ApiQuiz } from '../types/quiz';

const API_BASE = 'http://localhost:5023';

export async function fetchQuizzes(): Promise<ApiQuiz[]> {
  const res = await fetch(`${API_BASE}/quizzes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// STRETCH GOAL: Database Mutations
export async function createQuizDb(title: string): Promise<ApiQuiz> {
  const res = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description: "Created from React" })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function deleteQuizDb(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/quizzes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function updateQuizDb(id: string, title: string): Promise<void> {
  const res = await fetch(`${API_BASE}/quizzes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description: "Edited from React" })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}