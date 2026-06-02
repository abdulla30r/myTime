import { useState, useCallback } from 'react';

// ── Types ──
export interface RAMSRecord {
  name: string;     // "Abdullah Rahman (E1042)" — keeps legacy "(id)" suffix
  firstIn: string;  // "HH:MM:SS" zero-padded
}

export type RAMSStatus = 'idle' | 'loading' | 'success' | 'error';

// ── localStorage keys ──
const LS_RAMS_EMPLOYEE = 'myTime_ramsEmployee';
const LS_RAMS_CACHE = 'myTime_ramsCache';

// ── Stellar (Rumy Technologies) JSON API ──
// Proxied by Vite (and Apache in prod) → https://rumytechnologies.com/rams/json_api
const STELLAR_API_URL = '/rams-api/json_api';
const STELLAR_AUTH_USER = 'avianbpo';
const STELLAR_AUTH_CODE = '16ljku3xef8nh0uqhzvmu392lt7m7t8';

// Vendor blocks IPs that exceed 5 calls in 5 minutes.
// Browser sessions share this — multi-user office IP can trip it.
const RATE_LIMIT_MS = 5 * 60 * 1000;

// ── Vendor response shapes ──
interface StellarLogEntry {
  unit_name?: string;
  unit_id?: string;
  registration_id?: string;
  registraton_id?: string; // vendor typo — accept both
  user_name?: string;
  access_date?: string;
  access_time?: string;   // NOT zero-padded ("9:47:21")
  card?: string;
  access_id?: number;
}

interface CachedResponse {
  date: string;       // YYYY-MM-DD
  fetchedAt: number;  // ms epoch
  records: RAMSRecord[];
}

// ── Helpers ──
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "9:5:3" → "09:05:03" (zero-pad H:M:S, seconds default to 0) */
function padTime(t: string): string {
  const parts = t.split(':');
  if (parts.length < 2) return '';
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const ss = parts[2] !== undefined ? parseInt(parts[2], 10) : 0;
  if (isNaN(hh) || isNaN(mm)) return '';
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(isNaN(ss) ? 0 : ss).padStart(2, '0')}`;
}

function timeToSeconds(t: string): number {
  const parts = t.split(':');
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const ss = parts[2] ? parseInt(parts[2], 10) : 0;
  if (isNaN(hh) || isNaN(mm)) return Number.POSITIVE_INFINITY;
  return hh * 3600 + mm * 60 + (isNaN(ss) ? 0 : ss);
}

function loadCache(): CachedResponse | null {
  try {
    const raw = localStorage.getItem(LS_RAMS_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as CachedResponse;
  } catch { return null; }
}

function saveCache(c: CachedResponse): void {
  try { localStorage.setItem(LS_RAMS_CACHE, JSON.stringify(c)); } catch { /* ignore */ }
}

/**
 * Aggregate raw punches → one earliest-punch record per employee.
 * Mirrors `pair_punches_to_checkin_checkout` from the server doc, but only
 * keeps the first check-in (we don't surface check-out here).
 */
function pairFirstIn(logs: StellarLogEntry[]): RAMSRecord[] {
  type Acc = { name: string; regId: string; bestTime: string; bestSecs: number };
  const groups = new Map<string, Acc>();

  for (const entry of logs) {
    const regId = entry.registration_id ?? entry.registraton_id ?? '';
    const userName = entry.user_name ?? '';
    const accessTime = entry.access_time ?? '';
    if (!regId || !userName || !accessTime) continue;

    const secs = timeToSeconds(accessTime);
    const existing = groups.get(regId);
    if (!existing) {
      groups.set(regId, { name: userName, regId, bestTime: accessTime, bestSecs: secs });
    } else if (secs < existing.bestSecs) {
      existing.bestTime = accessTime;
      existing.bestSecs = secs;
    }
  }

  const records: RAMSRecord[] = [];
  for (const g of groups.values()) {
    const firstIn = padTime(g.bestTime);
    if (!firstIn) continue;
    records.push({ name: `${g.name} (${g.regId})`, firstIn });
  }
  records.sort((a, b) => timeToSeconds(a.firstIn) - timeToSeconds(b.firstIn));
  return records;
}

// ── Hook ──
export function useRAMS() {
  const [status, setStatus] = useState<RAMSStatus>('idle');
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<RAMSRecord[]>([]);
  const [savedEmployee, setSavedEmployee] = useState<string>(() => {
    try { return localStorage.getItem(LS_RAMS_EMPLOYEE) ?? ''; } catch { return ''; }
  });
  const hasSavedEmployee = savedEmployee !== '';

  const saveEmployee = (name: string) => {
    try { localStorage.setItem(LS_RAMS_EMPLOYEE, name); } catch { /* ignore */ }
    setSavedEmployee(name);
  };

  const clearSavedEmployee = () => {
    try { localStorage.removeItem(LS_RAMS_EMPLOYEE); } catch { /* ignore */ }
    setSavedEmployee('');
  };

  const fetchAttendance = useCallback(async () => {
    const today = todayStr();
    const cached = loadCache();
    const cacheFresh =
      cached !== null &&
      cached.date === today &&
      Date.now() - cached.fetchedAt < RATE_LIMIT_MS;

    // Serve from cache within the 5-min window — this is what keeps us under
    // the vendor's per-IP rate limit on quick reloads.
    if (cacheFresh && cached) {
      setRecords(cached.records);
      setStatus('success');
      setMessage(`Loaded ${cached.records.length} records (cached).`);
      return;
    }

    setStatus('loading');
    setMessage('Fetching attendance...');

    try {
      const res = await fetch(STELLAR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'fetch_log',
          auth_user: STELLAR_AUTH_USER,
          auth_code: STELLAR_AUTH_CODE,
          start_date: today,
          end_date: today,
          start_time: '00:00:00',
          end_time: '23:59:59',
        }),
      });

      if (!res.ok) {
        // On vendor error, prefer stale-but-today cache over an empty UI
        if (cached && cached.date === today) {
          setRecords(cached.records);
          setStatus('success');
          setMessage(`Vendor HTTP ${res.status} — using cached data.`);
          return;
        }
        setStatus('error');
        setMessage(`Vendor returned HTTP ${res.status}.`);
        return;
      }

      let data: any;
      try { data = await res.json(); }
      catch {
        setStatus('error');
        setMessage('Invalid JSON from vendor.');
        return;
      }

      // Vendor sometimes returns a JSON-encoded string on bad input
      if (typeof data === 'string') {
        setStatus('error');
        setMessage(`Vendor: ${data}`);
        return;
      }

      if (data?.error) {
        setStatus('error');
        setMessage(`Vendor: ${String(data.error)}`);
        return;
      }

      const logs: StellarLogEntry[] = Array.isArray(data?.log) ? data.log : [];
      const parsed = pairFirstIn(logs);

      if (parsed.length === 0) {
        setRecords([]);
        setStatus('error');
        setMessage('No attendance records with First-In time found for today.');
        return;
      }

      setRecords(parsed);
      saveCache({ date: today, fetchedAt: Date.now(), records: parsed });

      if (savedEmployee) {
        const match = parsed.find((r) => r.name === savedEmployee);
        if (match) {
          setStatus('success');
          setMessage(`${match.name} — ${match.firstIn}`);
          return;
        }
        setStatus('success');
        setMessage('Saved employee not found today. Select below.');
        return;
      }

      setStatus('success');
      setMessage(`Found ${parsed.length} records. Select your name.`);
    } catch (err) {
      // Network failure — fall back to today's cache if we have any
      if (cached && cached.date === today) {
        setRecords(cached.records);
        setStatus('success');
        setMessage('Network error — using cached data.');
        return;
      }
      setStatus('error');
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [savedEmployee]);

  return {
    status,
    message,
    records,
    fetchAttendance,
    hasSavedEmployee,
    savedEmployee,
    saveEmployee,
    clearSavedEmployee,
  };
}
