import type { ReactNode } from 'react';

interface ResultCardProps {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
  countdown?: boolean;
  children?: ReactNode;
}

export function ResultCard({ label, value, icon, highlight, countdown, children }: ResultCardProps) {
  const classes = [
    'result-card',
    highlight ? 'result-card--highlight' : '',
    countdown ? 'result-card--countdown' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className="result-card__icon">{icon}</span>
      <div className="result-card__body">
        <span className="result-card__label">{label}</span>
        <span className={`result-card__value${countdown ? ' countdown-value' : ''}`}>
          {value}
        </span>
        {children}
      </div>
    </div>
  );
}
