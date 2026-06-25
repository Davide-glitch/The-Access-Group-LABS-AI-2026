export type ApiQuiz = {
  id: string; title: string;
  description?: string; ownerId: string;
};

export type Answer   = { id: string; text: string; isCorrect?: boolean; };
export type Question = { id: string; text: string; answers: Answer[]; };
export type Quiz     = { id: string; title: string; questions: Question[]; };