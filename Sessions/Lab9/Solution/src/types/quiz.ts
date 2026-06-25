// ---------------------------------------------------------------------------
// Three kinds of quiz shape live in this app now. As in Lab 8, you don't
// have to type these out — read the comments, they explain why each exists.
// ---------------------------------------------------------------------------

// 1. ApiQuiz — the full record GET /quizzes and GET /quizzes/{id} return.
//    Questions now carry their own answer options (with isCorrect!) because
//    the API itself owns that data — this is the "owner" view, used by the
//    builder's "On the server" list. It is NOT what a student playing a
//    quiz should see (that's PlayQuiz, below) — never render ApiQuestion's
//    options as pickable answers in a play screen, the correct one is right
//    there in the payload.
export type ApiOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type ApiQuestion = {
  id: string;
  text: string;
  options: ApiOption[];
};

export type ApiQuiz = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  questions: ApiQuestion[];
};

// 2. Quiz / Question / Answer — the quiz being built in the browser, before
//    it's saved. Lives only in React state while the builder form is open.
//    NEW for Lab 9: each Answer now carries isCorrect, since the backend
//    needs to know which option is right to grade anything later.
export type Answer = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  answers: Answer[];
};

export type Quiz = {
  id: string;
  title: string;
  questions: Question[];
};

// 3. PlayQuiz / PlayQuestion / PlayOption — NEW for Lab 9. What
//    GET /quizzes/{id}/play returns: questions and options, with
//    isCorrect stripped out entirely. This is what you render when a
//    student is actually answering a quiz — there is no way to read the
//    right answer out of this response, by design.
export type PlayOption = {
  id: string;
  text: string;
};

export type PlayQuestion = {
  id: string;
  text: string;
  options: PlayOption[];
};

export type PlayQuiz = {
  id: string;
  title: string;
  description?: string;
  questions: PlayQuestion[];
};

// 4. QuizResult / QuestionResult / ResultOption — NEW for Lab 9. The
//    response from POST /quizzes/{id}/evaluate, returned only AFTER the
//    student has submitted their picks. isCorrect is back, because by now
//    revealing it is the whole point.
export type ResultOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuestionResult = {
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  wasCorrect: boolean;
  options: ResultOption[];
};

export type QuizResult = {
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  results: QuestionResult[];
};
