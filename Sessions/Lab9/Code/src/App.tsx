import { useState } from 'react';
import ExistingQuizzes from './components/ExistingQuizzes';
import QuizBuilder from './components/QuizBuilder';
import QuizRunner from './components/QuizRunner';
import ServerQuizDetail from './components/ServerQuizDetail';
import QuizCard from './components/QuizCard';
import type { ApiQuiz, Quiz } from './types/quiz';

// Turn a quiz fetched from the API into the local Quiz shape the runner
// understands. Server questions have no answer options, so each maps to a
// question with an empty `answers` list — the runner already renders those as
// "no answer options".
function apiQuizToLocal(api: ApiQuiz): Quiz {
  return {
    id: api.id,
    title: api.title,
    questions: api.questions.map((q) => ({ id: q.id, text: q.text, answers: [] })),
  };
}

// App owns the things the whole screen needs to agree on:
//   1. `quizzes` — the quizzes built in the browser. It lives here, not in
//      QuizBuilder, because both the builder (which adds to it) and the home
//      list / runner (which read from it) need it. That's "lifting state up".
//   2. `view` — which screen we're on. A tiny hand-rolled router.
//   3. `serverQuiz` — the API quiz the user clicked "View" on, so the detail
//      and run screens can read it after we leave the home list.
type View =
  | { name: 'home' }
  | { name: 'build' }
  | { name: 'run'; quizId: string }
  | { name: 'view-server' }
  | { name: 'run-server' };

function App() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<View>({ name: 'home' });
  const [serverQuiz, setServerQuiz] = useState<ApiQuiz | null>(null);
  // Bearer token for the authorized write calls, kept here (and in
  // localStorage) so it survives navigation and reloads instead of being
  // re-pasted every time. A real sign-in flow replaces this later.
  const [token, setToken] = useState(() => localStorage.getItem('apiToken') ?? '');
  // Bumping this remounts <ExistingQuizzes>, which re-runs its fetch — that's
  // how the "On the server" list refreshes after we POST a new quiz.
  const [serverReloadKey, setServerReloadKey] = useState(0);

  function setTokenPersisted(value: string) {
    setToken(value);
    localStorage.setItem('apiToken', value);
  }

  function addQuiz(quiz: Quiz) {
    setQuizzes((qs) => [...qs, quiz]);
    setView({ name: 'home' });
  }

  function refreshServerQuizzes() {
    setServerReloadKey((k) => k + 1);
  }

  function openServerQuiz(quiz: ApiQuiz) {
    setServerQuiz(quiz);
    setView({ name: 'view-server' });
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
            <QuizBuilder
              onCreate={addQuiz}
              onCancel={() => setView({ name: 'home' })}
              onSaved={refreshServerQuizzes}
              token={token}
              onTokenChange={setTokenPersisted}
            />
          </>
        )}

        {view.name === 'run' && runningQuiz && (
          <QuizRunner quiz={runningQuiz} onExit={() => setView({ name: 'home' })} />
        )}

        {view.name === 'view-server' && serverQuiz && (
          <ServerQuizDetail
            quiz={serverQuiz}
            onRun={() => setView({ name: 'run-server' })}
            onBack={() => setView({ name: 'home' })}
          />
        )}

        {view.name === 'run-server' && serverQuiz && (
          <QuizRunner
            quiz={apiQuizToLocal(serverQuiz)}
            onExit={() => setView({ name: 'view-server' })}
          />
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
              <ExistingQuizzes key={serverReloadKey} onOpen={openServerQuiz} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
