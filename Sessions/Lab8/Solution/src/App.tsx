import { useState } from 'react';
import ExistingQuizzes from './components/ExistingQuizzes';
import QuizBuilder from './components/QuizBuilder';
import QuizRunner from './components/QuizRunner';
import QuizCard from './components/QuizCard';
import type { Quiz } from './types/quiz';

// App owns the two things the whole screen needs to agree on:
//   1. `quizzes` — the quizzes built in the browser. It lives here, not in
//      QuizBuilder, because both the builder (which adds to it) and the home
//      list / runner (which read from it) need it. That's "lifting state up".
//   2. `view` — which screen we're on. A tiny hand-rolled router.
type View = { name: 'home' } | { name: 'build' } | { name: 'run'; quizId: string };

function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });

  function addQuiz(quiz: Quiz) {
    setQuizzes((qs) => [...qs, quiz]);
    setView({ name: 'home' });
  }

  const runningQuiz =
    view.name === 'run' ? quizzes.find((q) => q.id === view.quizId) : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setView({ name: 'home' })} style={{ cursor: 'pointer' }}>
          QuizMaster
        </h1>
        <p>Fetch quizzes from the API, then build and run your own.</p>
      </header>

      <main>
        {view.name === 'build' && (
          <>
            <h2 className="section-title">Create a quiz</h2>
            <QuizBuilder onCreate={addQuiz} onCancel={() => setView({ name: 'home' })} />
          </>
        )}

        {view.name === 'run' && runningQuiz && (
          <QuizRunner quiz={runningQuiz} onExit={() => setView({ name: 'home' })} />
        )}

        {view.name === 'home' && (
          <>
            <section>
              <div className="section-head">
                <h2 className="section-title">Your quizzes</h2>
                <button className="btn-primary" onClick={() => setView({ name: 'build' })}>
                  + New quiz
                </button>
              </div>
              {quizzes.length === 0 ? (
                <p className="status-message">
                  No quizzes yet — click <strong>New quiz</strong> to build one.
                </p>
              ) : (
                <div className="quiz-list">
                  {quizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      title={quiz.title}
                      subtitle={`${quiz.questions.length} question${
                        quiz.questions.length === 1 ? '' : 's'
                      }`}
                      action={
                        <button
                          className="btn-secondary"
                          onClick={() => setView({ name: 'run', quizId: quiz.id })}
                        >
                          Run
                        </button>
                      }
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="section-title">On the server</h2>
              <ExistingQuizzes />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
