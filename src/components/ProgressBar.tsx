interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      <span className="progress-bar__label">{percent}%</span>
    </div>
  );
}
