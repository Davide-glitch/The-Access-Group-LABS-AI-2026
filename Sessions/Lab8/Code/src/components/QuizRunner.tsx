import { useState } from 'react';
import type { Quiz } from '../types/quiz';

type QuizRunnerProps = { quiz: Quiz; onExit: () => void };

function QuizRunner({ quiz, onExit }: QuizRunnerProps) {
  const [current, setCurrent]   = useState(0);
  const [picks, setPicks]       = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[current];
  const isLast   = current === quiz.questions.length - 1;

  function pick(answerId: string) {
    setPicks((prev) => ({ ...prev, [question.id]: answerId }));
  }

  if (finished) {
    let score = 0;
    quiz.questions.forEach(q => {
      const selectedAnswer = q.answers.find(a => a.id === picks[q.id]);
      if (selectedAnswer?.isCorrect) score++;
    });

    return (
      <div>
        <h2>Summary: {score} / {quiz.questions.length} Correct</h2>
        {quiz.questions.map(q => {
          const selected = q.answers.find(a => a.id === picks[q.id]);
          const isRight = selected?.isCorrect;
          return (
            <p key={q.id}>
              <strong>{q.text}</strong><br />
              You picked: <span style={{ color: isRight ? 'green' : 'red' }}>{selected?.text || "Nothing"}</span>
            </p>
          );
        })}
        <button onClick={onExit} className="btn-primary">Back to home</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{question.text}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
        {question.answers.map(a => (
          <button 
            key={a.id} 
            onClick={() => pick(a.id)}
            style={{ 
              backgroundColor: picks[question.id] === a.id ? '#2563eb' : 'white',
              color: picks[question.id] === a.id ? 'white' : 'black',
              border: '1px solid #ccc', padding: '10px'
            }}
          >
            {a.text}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>Previous</button>
        {isLast ? (
          <button onClick={() => setFinished(true)} className="btn-primary">Finish</button>
        ) : (
          <button onClick={() => setCurrent(c => c + 1)}>Next</button>
        )}
      </div>
    </div>
  );
}

export default QuizRunner;