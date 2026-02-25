import { useState, useMemo, useEffect } from 'react';
import { calculateTimes, formatElapsed, formatCountdown, SCHEDULE_CONFIGS } from '../utils/timeCalculations';
import type { TimeResult, ScheduleMode } from '../types/time';

const LS_ENTRY = 'myTime_entryTime';
const LS_TD_H = 'myTime_tdHours';
const LS_TD_M = 'myTime_tdMinutes';
const LS_TD_SET_AT = 'myTime_tdSetAt';
const LS_MODE = 'myTime_mode';
const LS_STARTED = 'myTime_started';
const LS_STARTED_AT = 'myTime_startedAt';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

/** Get current time as "HH:MM" for default entry time */
function currentTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function loadString(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function loadNumber(key: string, fallback: number): number {
  try { const v = localStorage.getItem(key); return v !== null ? Number(v) : fallback; } catch { return fallback; }
}

export function useTimeCalculator() {
  // ── 12-hour staleness check ──
  const isStale = (): boolean => {
    try {
      const startedAt = localStorage.getItem(LS_STARTED_AT);
      if (!startedAt) return false;
      return Date.now() - Number(startedAt) > TWELVE_HOURS_MS;
    } catch { return false; }
  };

  const clearAllData = () => {
    try {
      localStorage.removeItem(LS_ENTRY);
      localStorage.removeItem(LS_TD_H);
      localStorage.removeItem(LS_TD_M);
      localStorage.removeItem(LS_TD_SET_AT);
      localStorage.removeItem(LS_STARTED);
      localStorage.removeItem(LS_STARTED_AT);
    } catch { /* ignore */ }
  };

  // On mount: if data is older than 12 hours, wipe everything
  const [staleChecked] = useState(() => {
    if (isStale()) { clearAllData(); }
    return true;
  });
  void staleChecked;

  // ── Started state (persisted) ──
  const [started, setStartedRaw] = useState<boolean>(() => {
    return loadString(LS_STARTED, 'false') === 'true';
  });
  const setStarted = (v: boolean) => {
    setStartedRaw(v);
    try {
      localStorage.setItem(LS_STARTED, String(v));
      if (v) localStorage.setItem(LS_STARTED_AT, String(Date.now()));
    } catch { /* ignore */ }
  };

  const [mode, setModeRaw] = useState<ScheduleMode>(() => {
    const saved = loadString(LS_MODE, 'ramadan');
    return (saved === 'regular' || saved === 'ramadan') ? saved : 'ramadan';
  });
  const setMode = (m: ScheduleMode) => { setModeRaw(m); };
  useEffect(() => { try { localStorage.setItem(LS_MODE, mode); } catch { /* ignore */ } }, [mode]);

  const config = SCHEDULE_CONFIGS[mode];

  const [entryTime, setEntryTimeRaw] = useState<string>(() => loadString(LS_ENTRY, currentTimeString()));

  // Derived entry hour/minute for custom inputs
  const entryHour = parseInt(entryTime.split(':')[0] || '0', 10);
  const entryMinute = parseInt(entryTime.split(':')[1] || '0', 10);
  const setEntryHour = (h: number) => {
    const clamped = Math.max(0, Math.min(23, h));
    setEntryTimeRaw((prev) => {
      const prevMin = parseInt(prev.split(':')[1] || '0', 10);
      return `${clamped.toString().padStart(2, '0')}:${prevMin.toString().padStart(2, '0')}`;
    });
  };
  const setEntryMinute = (m: number) => {
    const clamped = Math.max(0, Math.min(59, m));
    setEntryTimeRaw((prev) => {
      const prevHour = parseInt(prev.split(':')[0] || '0', 10);
      return `${prevHour.toString().padStart(2, '0')}:${clamped.toString().padStart(2, '0')}`;
    });
  };
  const setEntryTime = setEntryTimeRaw;

  const [tdHours, setTdHoursRaw] = useState<number>(() => loadNumber(LS_TD_H, 0));
  const [tdMinutes, setTdMinutesRaw] = useState<number>(() => loadNumber(LS_TD_M, 0));
  const [tdSetAt, setTdSetAt] = useState<number>(() => loadNumber(LS_TD_SET_AT, Date.now()));

  // Wrap setters so they also record the timestamp
  const setTdHours = (v: number) => { setTdHoursRaw(v); setTdSetAt(Date.now()); };
  const setTdMinutes = (v: number) => { setTdMinutesRaw(v); setTdSetAt(Date.now()); };

  // Persist to localStorage on change
  useEffect(() => { try { localStorage.setItem(LS_ENTRY, entryTime); } catch { /* ignore */ } }, [entryTime]);
  useEffect(() => { try { localStorage.setItem(LS_TD_H, String(tdHours)); } catch { /* ignore */ } }, [tdHours]);
  useEffect(() => { try { localStorage.setItem(LS_TD_M, String(tdMinutes)); } catch { /* ignore */ } }, [tdMinutes]);
  useEffect(() => { try { localStorage.setItem(LS_TD_SET_AT, String(tdSetAt)); } catch { /* ignore */ } }, [tdSetAt]);
  const [now, setNow] = useState<Date>(new Date());
  const [editingEntry, setEditingEntry] = useState(false);
  const [editingTd, setEditingTd] = useState(false);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const clock = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const result: TimeResult = useMemo(
    () => calculateTimes(entryTime, tdHours, tdMinutes, now, tdSetAt, mode),
    [entryTime, tdHours, tdMinutes, now, tdSetAt, mode],
  );

  const entryElapsedStr = formatElapsed(result.entryElapsedSeconds);
  const tdTrackedStr = formatElapsed(result.tdTrackedSeconds);
  const tdRemainingCountdown = formatCountdown(result.timeDoctorRemaining);
  const stayRemainingCountdown = formatCountdown(result.stayRemaining);
  const extraTimeCountdown = formatCountdown(result.extraTimeRequired);
  const effectiveStayRemainingCountdown = formatCountdown(result.effectiveStayRemaining);
  const freeTimeCountdown = formatCountdown(result.freeTime);

  return {
    started,
    setStarted,
    mode,
    setMode,
    config,
    entryHour,
    entryMinute,
    setEntryHour,
    setEntryMinute,
    entryTime,
    setEntryTime,
    tdHours,
    setTdHours,
    tdMinutes,
    setTdMinutes,
    result,
    clock,
    editingEntry,
    setEditingEntry,
    editingTd,
    setEditingTd,
    entryElapsedStr,
    tdTrackedStr,
    tdRemainingCountdown,
    stayRemainingCountdown,
    effectiveStayRemainingCountdown,
    extraTimeCountdown,
    freeTimeCountdown,
    recalculate: () => setNow(new Date()),
  };
}
