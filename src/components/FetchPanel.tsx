import { useState } from 'react';
import { useRAMS } from '../hooks/useRAMS';
import { useTimeDoctor } from '../hooks/useTimeDoctor';
import { getTDNameForRAMS } from '../utils/employeeMap';

interface FetchPanelProps {
  onApply: (entry: { hour: number; minute: number }, td: { hours: number; minutes: number } | null) => void;
}

export function FetchPanel({ onApply }: FetchPanelProps) {
  const rams = useRAMS();
  const td = useTimeDoctor();
  const [fetching, setFetching] = useState(false);

  const isLoading = fetching || rams.status === 'loading' || td.status === 'loading';

  // ── Single fetch: RAMS + TD in parallel ──
  const handleFetch = async () => {
    setFetching(true);


    // Wrap each in a settled promise so one failing doesn't block the other
    await Promise.allSettled([
      new Promise<void>((resolve) => {
        rams.fetchAttendance(() => { /* no auto-apply yet */ });
        // fetchAttendance is async internally but the hook updates state;
        // we resolve immediately and rely on state updates
        resolve();
      }),
      new Promise<void>((resolve) => {
        td.fetchTimeDoctor();
        resolve();
      }),
    ]);

    setFetching(false);
  };

  // ── Handle employee selection from RAMS dropdown ──
  const handleSelect = (ramsName: string) => {
    if (!ramsName) return;

    const ramsRecord = rams.records.find((r) => r.name === ramsName);
    if (!ramsRecord) return;

    // Parse RAMS entry time
    const parts = ramsRecord.firstIn.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return;

    // Save RAMS employee
    rams.saveEmployee(ramsRecord.name);

    // Look up TD via map
    const tdName = getTDNameForRAMS(ramsName);
    let tdData: { hours: number; minutes: number } | null = null;

    if (typeof tdName === 'string') {
      // Find matching TD record
      const tdRecord = td.records.find(
        (r) => r.name.toLowerCase() === tdName.toLowerCase()
      );
      if (tdRecord && tdRecord.seconds > 0) {
        tdData = {
          hours: Math.floor(tdRecord.seconds / 3600),
          minutes: Math.floor((tdRecord.seconds % 3600) / 60),
        };
      } else {
        // Has TD mapping but no tracked time today
        tdData = { hours: 0, minutes: 0 };
      }
    }
    // tdData stays null if no TD mapping → N/A

    onApply({ hour: h, minute: m }, tdData);
  };

  // Build dropdown items with TD info
  const dropdownItems = rams.records.map((r) => {
    const tdName = getTDNameForRAMS(r.name);
    let tdInfo = 'N/A';
    if (typeof tdName === 'string') {
      const tdRec = td.records.find(
        (rec) => rec.name.toLowerCase() === tdName.toLowerCase()
      );
      tdInfo = tdRec ? tdRec.timeWorked : '00:00:00';
    }
    return { ramsName: r.name, firstIn: r.firstIn, tdInfo };
  });

  return (
    <div className="fetch-panel">
      <button
        className="fetch-btn"
        onClick={handleFetch}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="fetch-spinner" />
            Fetching...
          </>
        ) : (
          '📡 Fetch Data'
        )}
      </button>

      {/* Status messages */}
      {rams.message && (
        <div className={`fetch-status fetch-status--${rams.status}`}>
          RAMS: {rams.message}
        </div>
      )}
      {td.message && (
        <div className={`fetch-status fetch-status--${td.status}`}>
          TD: {td.message}
        </div>
      )}

      {/* Employee picker — only RAMS list, TD auto-matched */}
      {!rams.hasSavedEmployee && rams.records.length > 0 && (
        <div className="fetch-select-group">
          <select
            className="fetch-select"
            defaultValue=""
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- Select your name --</option>
            {dropdownItems.map((item) => (
              <option key={item.ramsName} value={item.ramsName}>
                {item.ramsName} — Entry: {item.firstIn} | TD: {item.tdInfo}
              </option>
            ))}
          </select>
        </div>
      )}

      {rams.hasSavedEmployee && (rams.status === 'idle' || rams.status === 'success') && (
        <button
          className="fetch-change-btn"
          onClick={() => { rams.clearSavedEmployee(); window.location.reload(); }}
        >
          ↻ Change Employee
        </button>
      )}
    </div>
  );
}
