import type { ReactNode } from 'react';

type QuizCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;   // an optional button the parent supplies
};

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