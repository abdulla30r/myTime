import { useState, useCallback } from 'react';

// ── Types ──
export type TDStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Hardcoded credentials (admin account with all-user access) ──
const TD_EMAIL = 'arshil.azim@avianbpo.com';
const TD_PASSWORD = 'Noshortcut1.';

// ── localStorage keys ──
const LS_TD_TOKEN = 'myTime_tdToken';
const LS_TD_COMPANY = 'myTime_tdCompanyId';
const LS_TD_USER = 'myTime_tdUserId';
const LS_TD_TOKEN_TIME = 'myTime_tdTokenTime';

// ── API strategies ──
const TD_STRATEGIES = [
  { name: 'Proxy', baseUrl: '/td-api' },
  { name: 'Direct', baseUrl: 'https://api2.timedoctor.com/api/1.0' },
];

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// ── Token helpers ──
function getSavedToken() {
  const token = localStorage.getItem(LS_TD_TOKEN);
  const companyId = localStorage.getItem(LS_TD_COMPANY);
  const userId = localStorage.getItem(LS_TD_USER);
  const tokenTime = parseInt(localStorage.getItem(LS_TD_TOKEN_TIME) || '0', 10);

  if (!token || !companyId || !userId) return null;
  if (Date.now() - tokenTime > SIX_HOURS_MS) return null;

  return { token, companyId, userId };
}

function saveToken(data: { token: string; companyId: string; userId: string }) {
  localStorage.setItem(LS_TD_TOKEN, data.token);
  localStorage.setItem(LS_TD_COMPANY, data.companyId);
  localStorage.setItem(LS_TD_USER, data.userId);
  localStorage.setItem(LS_TD_TOKEN_TIME, Date.now().toString());
}

// ── Helpers ──
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function secondsToHMS(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Strategy runner ──
async function tryStrategy(
  baseUrl: string,
  email: string,
  password: string,
  storedAuth: { token: string; companyId: string; userId: string } | null,
): Promise<{ totalSeconds: number; auth: { token: string; companyId: string; userId: string } }> {
  let auth = storedAuth;

  // Verify token if available
  if (auth) {
    try {
      const res = await fetch(`${baseUrl}/users?company=${auth.companyId}&token=${auth.token}`, {
        headers: { Authorization: `JWT ${auth.token}` },
      });
      if (res.status === 401 || res.status === 403) auth = null;
      else if (!res.ok) auth = null;
    } catch {
      auth = null;
    }
  }

  // Login if needed
  if (!auth) {
    const loginRes = await fetch(`${baseUrl}/authorization/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, permissions: 'read' }),
    });

    if (loginRes.status === 401 || loginRes.status === 403) {
      const err = new Error('Invalid email or password.');
      (err as any).isAuthError = true;
      throw err;
    }
    if (!loginRes.ok) throw new Error(`Login HTTP ${loginRes.status}`);

    const loginData = await loginRes.json();
    const d = loginData.data || loginData;
    const token = d.token || d.user?.token;
    const companyId =
      d.companyId || d.company?.id || (d.companies?.length > 0 && d.companies[0].id) || d.user?.companyId;
    const userId = d.userId || d.user?.id || d.id;

    if (!token) throw new Error('No auth token received.');

    auth = { token, companyId: String(companyId), userId: String(userId) };
    saveToken(auth);
  }

  // Fetch today's time
  const date = todayStr();
  const authHeaders = { Authorization: `JWT ${auth.token}` };
  const tokenParam = `&token=${auth.token}`;
  let totalSeconds = 0;

  // Attempt A: /activity/worklog
  try {
    const url = `${baseUrl}/activity/worklog?company=${auth.companyId}&user=${auth.userId}&from=${date}T00:00:00&to=${date}T23:59:59${tokenParam}`;
    const res = await fetch(url, { headers: authHeaders });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(LS_TD_TOKEN);
      throw new Error('Token expired');
    }
    if (res.ok) {
      const data = await res.json();
      const entries: any[] = [];
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (Array.isArray(item)) entries.push(...item);
          else if (item && typeof item === 'object') entries.push(item);
        });
      }
      entries.forEach((entry: any) => {
        if (entry.time && typeof entry.time === 'number') totalSeconds += entry.time;
        else if (entry.duration && typeof entry.duration === 'number') totalSeconds += entry.duration;
        else if (entry.total && typeof entry.total === 'number') totalSeconds += entry.total;
        else if (entry.start && entry.end) {
          totalSeconds += Math.floor((new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 1000);
        }
      });
    }
  } catch (e: any) {
    if (e.message === 'Token expired') throw e;
  }

  // Attempt B: /stats
  if (totalSeconds === 0) {
    try {
      const url = `${baseUrl}/stats?company=${auth.companyId}&user=${auth.userId}&from=${date}&to=${date}&period=days${tokenParam}`;
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            const t = item.total || item.totalTracked || item.tracked || item.totalSec || item.trackedSec || 0;
            if (t > 0) totalSeconds += t;
            if (item.dates && Array.isArray(item.dates)) {
              item.dates.forEach((dd: any) => {
                totalSeconds += dd.total || dd.totalTracked || dd.tracked || 0;
              });
            }
          });
        } else if (data.data && typeof data.data === 'object') {
          totalSeconds = data.data.total || data.data.totalTracked || data.data.tracked || 0;
        }
      }
    } catch { /* ignore */ }
  }

  // Attempt C: /activity/summary
  if (totalSeconds === 0) {
    try {
      const url = `${baseUrl}/activity/summary?company=${auth.companyId}&user=${auth.userId}&from=${date}&to=${date}${tokenParam}`;
      const res = await fetch(url, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            totalSeconds += item.total || item.totalTracked || item.tracked || item.totalSec || item.trackedSec || item.duration || 0;
          });
        } else if (data.data && typeof data.data === 'object') {
          totalSeconds = data.data.total || data.data.totalTracked || 0;
        }
      }
    } catch { /* ignore */ }
  }

  return { totalSeconds, auth };
}

// ── Hook ──
export function useTimeDoctor() {
  const [status, setStatus] = useState<TDStatus>('idle');
  const [message, setMessage] = useState('');
  const [timeWorked, setTimeWorked] = useState<string | null>(null);

  const fetchTimeDoctor = useCallback(
    async (onApply?: (hours: number, minutes: number) => void) => {
      setStatus('loading');
      setMessage('Connecting...');

      const storedAuth = getSavedToken();
      let lastError: Error | null = null;

      for (let i = 0; i < TD_STRATEGIES.length; i++) {
        const strategy = TD_STRATEGIES[i];
        setMessage(`${i === 0 ? 'Connecting' : 'Retrying'} via ${strategy.name}...`);

        try {
          const result = await tryStrategy(strategy.baseUrl, TD_EMAIL, TD_PASSWORD, storedAuth);
          const formatted = secondsToHMS(result.totalSeconds);
          const hours = Math.floor(result.totalSeconds / 3600);
          const minutes = Math.floor((result.totalSeconds % 3600) / 60);

          setTimeWorked(formatted);
          setStatus('success');
          setMessage(`Time worked: ${formatted}`);

          if (onApply) onApply(hours, minutes);
          return;
        } catch (err: any) {
          lastError = err;
          if (err.isAuthError) {
            setStatus('error');
            setMessage(err.message);
            return;
          }
        }
      }

      setStatus('error');
      setMessage(lastError?.message ?? 'Could not connect to TimeDoctor.');
    },
    [],
  );

  return {
    status,
    message,
    timeWorked,
    fetchTimeDoctor,
  };
}
