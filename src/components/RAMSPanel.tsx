import { useRAMS } from '../hooks/useRAMS';

interface RAMSPanelProps {
  onApply: (hour: number, minute: number) => void;
}

export function RAMSPanel({ onApply }: RAMSPanelProps) {
  const {
    status,
    message,
    records,
    selectedTime,
    fetchAttendance,
    hasSavedEmployee,
    saveEmployee,
    clearSavedEmployee,
  } = useRAMS();

  const handleFetch = () => {
    fetchAttendance(onApply);
  };

  const handleSelect = (name: string) => {
    if (!name) return;
    const record = records.find((r) => r.name === name);
    if (record) {
      saveEmployee(record.name);
      const parts = record.firstIn.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        onApply(h, m);
      }
    }
  };

  return (
    <div className="rams-panel rams-panel--inline">
      <button
        className="rams-fetch-btn"
        onClick={handleFetch}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <span className="rams-spinner" />
            Fetching...
          </>
        ) : (
          '📡 Fetch Entry from RAMS'
        )}
      </button>

      {message && (
        <div className={`rams-status rams-status--${status}`}>
          {message}
        </div>
      )}

      {/* First time: show dropdown to pick employee */}
      {!hasSavedEmployee && records.length > 0 && (
        <div className="rams-select-group">
          <select
            className="rams-select"
            value={selectedTime}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- Select your name --</option>
            {records.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name} — {r.firstIn}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasSavedEmployee && (status === 'idle' || status === 'success') && (
        <button
          className="rams-change-btn"
          onClick={() => { clearSavedEmployee(); window.location.reload(); }}
        >
          ↻ Change Employee
        </button>
      )}
    </div>
  );
}
