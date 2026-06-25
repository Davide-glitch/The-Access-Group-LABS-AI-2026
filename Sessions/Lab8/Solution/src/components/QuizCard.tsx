import type { ReactNode } from 'react';

type QuizCardProps = {
  title: string;
  subtitle?: string;
  // Optional slot the parent fills with a button (e.g. "Run"). QuizCard
  // doesn't know or care what it is — it just gives it a place to sit.
  action?: ReactNode;
};

// Pure presentational component: props in, JSX out. It owns no state and
// decides nothing — whoever renders it hands down the title, the subtitle,
// and (optionally) an action button. Used for both the quizzes fetched from
// the API and the quizzes built in the browser.
function QuizCard({ title, subtitle, action }: QuizCardProps) {
  return (
    <div className="quiz-card">
      <div className="quiz-card-text">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="quiz-card-action">{action}</div>}
    </div>
  );
}

export default QuizCard;
