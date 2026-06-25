// ---------------------------------------------------------------------------
// Two kinds of quiz live in this app, and it's worth being clear about why.
// ---------------------------------------------------------------------------

// 1. ApiQuiz — what the backend gives us from GET /quizzes. It mirrors
//    Models/Quiz.cs on the API, field for field. We only ever READ these:
//    the API's write endpoints require sign-in, which is a later session.
export type ApiQuiz = {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
};

// 2. Quiz / Question / Answer — the quizzes the student builds in the
//    browser. These live only in React state. Nothing here is sent to the
//    API; "create", "add question", "add answer" and "run" are all local.
//
//    Note there is no "isCorrect" flag — running a quiz here means stepping
//    through the questions and picking an option, not grading.
export type Answer = {
  id: string;
  text: string;
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
