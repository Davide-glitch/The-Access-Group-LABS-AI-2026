import { useState } from 'react';
import type { Question, Quiz } from '../types/quiz';

type QuizBuilderProps = { 
  initialQuiz?: Quiz; 
  onCreate: (quiz: Quiz) => void; 
  onCancel: () => void; 
};

function QuizBuilder({ initialQuiz, onCreate, onCancel }: QuizBuilderProps) {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || []);
  const [errorMsg, setErrorMsg] = useState(''); 

  function addQuestion() {
    setQuestions((qs) => [...qs, { id: crypto.randomUUID(), text: '', answers: [] }]);
  }
  
  function updateQuestionText(qid: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, text } : q)));
  }
  
  function addAnswer(qid: string) {
    setQuestions((qs) => qs.map((q) =>
      q.id === qid ? { ...q, answers: [...q.answers, { id: crypto.randomUUID(), text: '', isCorrect: false }] } : q));
  }
  
  function updateAnswerText(qid: string, aid: string, text: string) {
    setQuestions((qs) => qs.map((q) => q.id === qid
      ? { ...q, answers: q.answers.map((a) => (a.id === aid ? { ...a, text } : a)) }
      : q));
  }

  function setCorrectAnswer(qid: string, aid: string) {
    setQuestions((qs) => qs.map((q) => q.id === qid
      ? { ...q, answers: q.answers.map((a) => ({ ...a, isCorrect: a.id === aid })) }
      : q));
  }
  
  function save() {
    if (title.trim() === '') return setErrorMsg('Error: Your quiz needs a title.'); 
    if (questions.length === 0) return setErrorMsg('Error: You must add at least one question.'); 
    
    for (const q of questions) {
      if (q.text.trim() === '') return setErrorMsg('Error: All questions must have text.'); 
      if (q.answers.length < 2) return setErrorMsg('Error: Every question needs at least 2 answers.'); 
      const hasCorrect = q.answers.some(a => a.isCorrect);
      if (!hasCorrect) return setErrorMsg('Error: Every question must have one correct answer selected.');
      for (const a of q.answers) {
        if (a.text.trim() === '') return setErrorMsg('Error: All answer options must have text.'); 
      }
    }

    setErrorMsg('');
    onCreate({ id: initialQuiz?.id || crypto.randomUUID(), title: title.trim(), questions });
  }

  return (
    <div className="quiz-builder">
      <h2>{initialQuiz ? 'Edit Quiz' : 'Build a Quiz'}</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz Title" />
      
      {questions.map(q => (
        <div key={q.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <input value={q.text} onChange={e => updateQuestionText(q.id, e.target.value)} placeholder="Question text" />
          
          <div style={{ marginLeft: '20px', marginTop: '10px' }}>
            {q.answers.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="radio" name={`correct-${q.id}`} checked={a.isCorrect || false} onChange={() => setCorrectAnswer(q.id, a.id)} />
                <input value={a.text} onChange={e => updateAnswerText(q.id, a.id, e.target.value)} placeholder="Answer text" />
              </div>
            ))}
            <button onClick={() => addAnswer(q.id)}>+ Add answer</button>
          </div>
        </div>
      ))}
      
      {errorMsg && <p style={{ color: '#dc2626', fontWeight: 'bold' }}>{errorMsg}</p>}
      
      <div style={{ marginTop: '20px', gap: '10px', display: 'flex' }}>
        <button onClick={addQuestion}>+ Add question</button>
        <button onClick={save} className="btn-primary">{initialQuiz ? 'Save Changes' : 'Create quiz'}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default QuizBuilder;