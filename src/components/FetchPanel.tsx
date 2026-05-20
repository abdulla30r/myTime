import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRAMS } from '../hooks/useRAMS';
import { useTimeDoctor } from '../hooks/useTimeDoctor';
import type { RAMSRecord } from '../hooks/useRAMS';
import type { TDRecord } from '../hooks/useTimeDoctor';
import { getTDNameForRAMS } from '../utils/employeeMap';

export interface FetchPanelHandle {
  refresh: () => void;
}

export interface FirstArrivalState {
  status: 'loading' | 'empty' | 'found';
  first: { name: string; firstIn: string } | null;
}

export interface LeaderboardData {
  ramsStatus: 'idle' | 'loading' | 'success' | 'error';
  tdStatus: 'idle' | 'loading' | 'success' | 'error';
  rams: RAMSRecord[];
  td: TDRecord[];
}

interface FetchPanelProps {
  onApply: (entry: { hour: number; minute: number }, td: { hours: number; minutes: number } | null) => void;
  onLoadingChange?: (loading: boolean) => void;
  onMessages?: (messages: string[]) => void;
  onFirstArrival?: (state: FirstArrivalState | null) => void;
  onLeaderboardData?: (data: LeaderboardData) => void;
}

function firstInToMinutes(firstIn: string): number {
  const [h, m] = firstIn.split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  if (isNaN(hh) || isNaN(mm)) return Number.POSITIVE_INFINITY;
  return hh * 60 + mm;
}

export const FetchPanel = forwardRef<FetchPanelHandle, FetchPanelProps>(function FetchPanel({ onApply, onLoadingChange, onMessages, onFirstArrival, onLeaderboardData }, ref) {
  const rams = useRAMS();
  const td = useTimeDoctor();
  const [fetching, setFetching] = useState(false);
  const autoApplied = useRef(false); // prevent double-apply

  const isLoading = fetching || rams.status === 'loading' || td.status === 'loading';

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  // Pipe status messages to parent for overlay
  useEffect(() => {
    const msgs: string[] = [];
    if (rams.message) msgs.push(`RAMS: ${rams.message}`);
    if (td.message) msgs.push(`TD: ${td.message}`);
    if (msgs.length > 0) onMessages?.(msgs);
  }, [rams.message, td.message, onMessages]);

  // Emit RAMS arrival state to parent (for top banner)
  useEffect(() => {
    if (!onFirstArrival) return;

    if (rams.status === 'loading') {
      onFirstArrival({ status: 'loading', first: null });
      return;
    }

    if (rams.records.length > 0) {
      const earliest = rams.records.reduce((best, r) =>
        firstInToMinutes(r.firstIn) < firstInToMinutes(best.firstIn) ? r : best
      );
      onFirstArrival({ status: 'found', first: { name: earliest.name, firstIn: earliest.firstIn } });
      return;
    }

    // RAMS finished but produced no records → no one in yet today
    if (
      rams.status === 'success' ||
      (rams.status === 'error' && /no attendance|no records|no first-in/i.test(rams.message))
    ) {
      onFirstArrival({ status: 'empty', first: null });
      return;
    }

    // idle, or a real error (login/network) → hide banner
    onFirstArrival(null);
  }, [rams.status, rams.records, rams.message, onFirstArrival]);

  // Emit combined records for the Leaderboard view
  useEffect(() => {
    onLeaderboardData?.({
      ramsStatus: rams.status,
      tdStatus: td.status,
      rams: rams.records,
      td: td.records,
    });
  }, [rams.status, td.status, rams.records, td.records, onLeaderboardData]);

  // ── Single fetch: RAMS + TD in parallel ──
  const handleFetch = async () => {
    setFetching(true);
    autoApplied.current = false;

    // Wrap each in a settled promise so one failing doesn't block the other
    await Promise.allSettled([
      new Promise<void>((resolve) => {
        rams.fetchAttendance();
        resolve();
      }),
      new Promise<void>((resolve) => {
        td.fetchTimeDoctor();
        resolve();
      }),
    ]);

    setFetching(false);
  };

  useImperativeHandle(ref, () => ({ refresh: handleFetch }));

  // Auto-fetch once on mount so the top banner can display attendance immediately
  const didAutoFetch = useRef(false);
  useEffect(() => {
    if (didAutoFetch.current) return;
    didAutoFetch.current = true;
    handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-apply saved employee once both RAMS + TD finish ──
  useEffect(() => {
    if (autoApplied.current) return;
    if (!rams.hasSavedEmployee || !rams.savedEmployee) return;
    if (rams.status !== 'success' || rams.records.length === 0) return;
    // TD can be success OR error (some employees have no TD)
    if (td.status !== 'success' && td.status !== 'error') return;

    const match = rams.records.find((r) => r.name === rams.savedEmployee);
    if (!match) return;

    autoApplied.current = true;
    handleSelect(match.name);
  }, [rams.status, rams.records, rams.hasSavedEmployee, rams.savedEmployee, td.status]);

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

    // Clear any previous TD userId
    try { localStorage.removeItem('myTime_tdSelectedUserId'); } catch { /* */ }

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
      // Save the matched TD userId for activity stats
      if (tdRecord) {
        try { localStorage.setItem('myTime_tdSelectedUserId', tdRecord.userId); } catch { /* */ }
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
          onClick={() => { rams.clearSavedEmployee(); handleFetch(); }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="fetch-spinner" />
              Fetching...
            </>
          ) : (
            '↻ Change Employee'
          )}
        </button>
      )}
    </div>
  );
});
