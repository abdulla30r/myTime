import { useTimeDoctor } from '../hooks/useTimeDoctor';

interface TDPanelProps {
  onApply: (hours: number, minutes: number) => void;
}

export function TDPanel({ onApply }: TDPanelProps) {
  const {
    status,
    message,
    records,
    fetchTimeDoctor,
    hasSavedEmployee,
    saveEmployee,
    clearSavedEmployee,
  } = useTimeDoctor();

  const handleFetch = () => {
    fetchTimeDoctor(onApply);
  };

  const handleSelect = (name: string) => {
    if (!name) return;
    const record = records.find((r) => r.name === name);
    if (record) {
      saveEmployee(record.name);
      const hours = Math.floor(record.seconds / 3600);
      const minutes = Math.floor((record.seconds % 3600) / 60);
      onApply(hours, minutes);
    }
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
          '🖥 Fetch from Mr Time'
        )}
      </button>

      {message && (
        <div className={`td-status td-status--${status}`}>
          {message}
        </div>
      )}

      {/* Employee picker — show when records fetched and no saved employee */}
      {!hasSavedEmployee && records.length > 0 && (
        <div className="td-select-group">
          <select
            className="td-select"
            defaultValue=""
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- Select your name --</option>
            {records.map((r) => (
              <option key={r.userId} value={r.name}>
                {r.name} — {r.timeWorked}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasSavedEmployee && (status === 'idle' || status === 'success') && (
        <button
          className="td-change-btn"
          onClick={() => { clearSavedEmployee(); }}
        >
          ↻ Change Employee
        </button>
      )}
    </div>
  );
}
