import type { ApiQuiz } from '../types/quiz';

type Props = { quiz: ApiQuiz; onRun: () => void; onBack: () => void; };

function ServerQuizDetail({ quiz, onRun, onBack }: Props) {
  return (
    <div className="runner">
      <h2>{quiz.title}</h2>
      {quiz.description && <p>{quiz.description}</p>}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button className="btn-primary" onClick={onRun}>Play Quiz</button>
        <button className="btn-ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

export default ServerQuizDetail;