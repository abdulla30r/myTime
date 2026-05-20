import { useState, useCallback } from 'react';

export interface ActivityRow {
  userId: string;
  activeRatio: number; // 0–1 (standardActiveSecRatio with fallback)
  activeSec: number;
  totalSec: number;
}

export type ActivityLeaderboardStatus = 'idle' | 'loading' | 'success' | 'error';

const LS_TD_TOKEN = 'myTime_tdToken';
const LS_TD_COMPANY = 'myTime_tdCompanyId';
const LS_TD_TOKEN_TIME = 'myTime_tdTokenTime';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const FIELDS = [
  'userId', 'totalSec', 'activeSec', 'activeSecRatio',
  'standardActiveSecRatio',
].join(',');

function getAuth(): { token: string; companyId: string } | null {
  const token = localStorage.getItem(LS_TD_TOKEN);
  const companyId = localStorage.getItem(LS_TD_COMPANY);
  const tokenTime = parseInt(localStorage.getItem(LS_TD_TOKEN_TIME) || '0', 10);
  if (!token || !companyId) return null;
  if (Date.now() - tokenTime > SIX_HOURS_MS) return null;
  return { token, companyId };
}

export function useActivityLeaderboard() {
  const [status, setStatus] = useState<ActivityLeaderboardStatus>('idle');
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) {
      setStatus('success');
      setRows([]);
      return;
    }
    const auth = getAuth();
    if (!auth) {
      setStatus('error');
      setError('No valid Mr Time session — fetch data first.');
      return;
    }

    setStatus('loading');
    setError('');

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const params = new URLSearchParams({
      company: auth.companyId,
      user: userIds.join(','),
      fields: FIELDS,
      from: start.toISOString(),
      to: end.toISOString(),
      'group-by': 'userId',
      sort: 'modeTotal',
      limit: '500',
      token: auth.token,
    });

    const url = `/td-api-v11/stats/total?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: { Authorization: `JWT ${auth.token}` } });
      if (!res.ok) {
        setStatus('error');
        setError(`HTTP ${res.status}`);
        return;
      }
      const json = await res.json();
      const list: any[] = Array.isArray(json.data) ? json.data : [];
      const parsed: ActivityRow[] = list.map((item) => ({
        userId: String(item.userId ?? ''),
        activeRatio: typeof item.standardActiveSecRatio === 'number'
          ? item.standardActiveSecRatio
          : (item.activeSecRatio ?? 0),
        activeSec: item.activeSec ?? 0,
        totalSec: item.totalSec ?? 0,
      })).filter((r) => r.userId && r.totalSec > 0);

      setRows(parsed);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Fetch failed');
    }
  }, []);

  return { status, rows, error, fetchAll };
}
