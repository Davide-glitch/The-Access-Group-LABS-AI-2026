import { useState, useEffect } from 'react';
import { useQuizzes } from './api/useQuizzes';
import { createQuizDb, deleteQuizDb, updateQuizDb } from './api/quizzes';
import QuizBuilder from './components/QuizBuilder';
import QuizRunner from './components/QuizRunner';
import QuizCard from './components/QuizCard';
import type { Quiz } from './types/quiz';

type View = { name: 'home' } | { name: 'build' } | { name: 'run'; quizId: string } | { name: 'edit'; quizId: string };

function App() {
  const { quizzes: apiQuizzes, loading, error } = useQuizzes();
  
  // 1. Initialize from localStorage so your quizzes SURVIVE a page refresh
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('quizmaster_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [view, setView] = useState<View>({ name: 'home' });

  // 2. Save to localStorage every single time a quiz is added, edited, or deleted
  useEffect(() => {
    localStorage.setItem('quizmaster_data', JSON.stringify(localQuizzes));
  }, [localQuizzes]);

  // 3. Merge API Quizzes into the playable list so you can Run/Edit them
  useEffect(() => {
    if (apiQuizzes.length > 0) {
      setLocalQuizzes(prevLocal => {
        const merged = [...prevLocal];
        apiQuizzes.forEach(apiQ => {
          // Only pull it in if we haven't already saved it locally
          if (!merged.find(q => q.id === apiQ.id)) {
            merged.push({ id: apiQ.id, title: apiQ.title, questions: [] });
          }
        });
        return merged;
      });
    }
  }, [apiQuizzes]);

  async function handleCreateOrUpdate(quiz: Quiz) {
    try {
      const existing = localQuizzes.find(q => q.id === quiz.id);
      if (existing) {
        setLocalQuizzes(qs => qs.map(q => q.id === quiz.id ? quiz : q));
        await updateQuizDb(quiz.id, quiz.title); // Update DB Title
      } else {
        setLocalQuizzes(qs => [...qs, quiz]);
        await createQuizDb(quiz.title); // Save DB Title
      }
    } catch (e) {
      console.warn("DB Save failed. Full quiz saved locally.", e);
    }
    setView({ name: 'home' });
  }

  async function deleteQuiz(id: string) {
    // Delete from local storage memory
    setLocalQuizzes(qs => qs.filter(q => q.id !== id));
    
    // Attempt to delete from the C# database
    try {
      await deleteQuizDb(id);
    } catch (e) {
      console.warn("DB Delete failed.", e);
    }
  }

  const running = view.name === 'run' ? localQuizzes.find((q) => q.id === view.quizId) : undefined;
  const editing = view.name === 'edit' ? localQuizzes.find((q) => q.id === view.quizId) : undefined;

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setView({ name: 'home' })} style={{cursor: 'pointer'}}>QuizMaster</h1>
      </header>
      <main>
        {view.name === 'build' && (
          <QuizBuilder onCreate={handleCreateOrUpdate} onCancel={() => setView({ name: 'home' })} />
        )}
        {view.name === 'edit' && editing && (
          <QuizBuilder initialQuiz={editing} onCreate={handleCreateOrUpdate} onCancel={() => setView({ name: 'home' })} />
        )}
        {view.name === 'run' && running && (
          <QuizRunner quiz={running} onExit={() => setView({ name: 'home' })} />
        )}
        {view.name === 'home' && (
          <>
            <button className="btn-primary" onClick={() => setView({ name: 'build' })}>+ New quiz</button>
            
            {loading && <p>Syncing with database...</p>}
            {error && <p style={{color: 'red'}}>Database connection error: {error}</p>}
            
            <h2 style={{marginTop: '20px'}}>All Quizzes</h2>
            <div style={{ margin: '10px 0' }}>
              {localQuizzes.map((q) => (
                <QuizCard key={q.id} title={q.title} subtitle={`${q.questions.length} questions`} action={
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setView({ name: 'run', quizId: q.id })}>Run</button>
                      <button onClick={() => setView({ name: 'edit', quizId: q.id })}>Edit</button>
                      <button onClick={() => deleteQuiz(q.id)} style={{ backgroundColor: '#dc2626', color: 'white' }}>Delete</button>
                    </div>
                } />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;