import { useTimeDoctor } from '../hooks/useTimeDoctor';

interface TDPanelProps {
  onApply: (hours: number, minutes: number) => void;
}

export function TDPanel({ onApply }: TDPanelProps) {
  const {
    status,
    message,
    timeWorked,
    fetchTimeDoctor,
  } = useTimeDoctor();

  const handleFetch = () => {
    fetchTimeDoctor(onApply);
  };

  return (
    <div className="td-panel">
      <button
        className="td-fetch-btn"
        onClick={handleFetch}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <span className="td-spinner" />
            Fetching...
          </>
        ) : (
          '🖥 Fetch from Time Doctor'
        )}
      </button>

      {message && (
        <div className={`td-status td-status--${status}`}>
          {message}
        </div>
      )}

      {timeWorked && status === 'success' && (
        <div className="td-result">
          ✅ Applied: <strong>{timeWorked}</strong>
        </div>
      )}
    </div>
  );
}
