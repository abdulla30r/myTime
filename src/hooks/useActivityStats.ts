import { useState, useCallback } from 'react';

// ── Types ──
export interface ActivityStats {
  totalSec: number;
  activeSec: number;
  activeSecRatio: number;
  standardActiveSecRatio: number;
  activeBiasRatio: number;
  idleSec: number;
  idleMins: number;
  idleMinsRatio: number;
  idleSecRatio: number;
  unprod: number;
  unprodRatio: number;
  mobile: number;
  mobileRatio: number;
  manual: number;
  manualRatio: number;
  meeting: number;
  meetingRatio: number;
  paidBreak: number;
  paidBreakRatio: number;
  unpaidBreak: number;
  paidLeave: number;
}

export type StatsStatus = 'idle' | 'loading' | 'success' | 'error';

// ── localStorage keys (reuse from useTimeDoctor) ──
const LS_TD_TOKEN = 'myTime_tdToken';
const LS_TD_COMPANY = 'myTime_tdCompanyId';
const LS_TD_TOKEN_TIME = 'myTime_tdTokenTime';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** Fields requested from /api/1.1/stats/total */
const TD_STATS_FIELDS = [
  'userId', 'idleSec', 'idleMins', 'idleMinsRatio', 'idleSecRatio',
  'totalSec', 'mobile', 'mobileRatio', 'manual', 'manualRatio',
  'unprod', 'unprodRatio', 'activeSec', 'activeSecRatio',
  'activeBiasRatio', 'standardActiveSecRatio',
  'paidBreak', 'paidBreakRatio', 'unpaidBreak', 'paidLeave',
  'meeting', 'meetingRatio',
].join(',');

/** Get stored auth data if still valid */
function getAuth(): { token: string; companyId: string } | null {
  const token = localStorage.getItem(LS_TD_TOKEN);
  const companyId = localStorage.getItem(LS_TD_COMPANY);
  const tokenTime = parseInt(localStorage.getItem(LS_TD_TOKEN_TIME) || '0', 10);

  if (!token || !companyId) return null;
  if (Date.now() - tokenTime > SIX_HOURS_MS) return null;

  return { token, companyId };
}

/** Get the v1.1 base URL — uses proxy path */
function getV11BaseUrl(): string {
  return '/td-api-v11';
}

/** Convert ratio (0–1) to activity level label matching TD dashboard */
export function activityRatioToLevel(ratio: number): string {
  const pct = (ratio || 0) * 100;
  if (pct >= 80) return 'Very High';
  if (pct >= 60) return 'High';
  if (pct >= 40) return 'Medium';
  if (pct >= 20) return 'Low';
  return 'Very Low';
}

/** Get CSS class name for color-coding stat values */
export function getStatColorClass(pct: number, type: 'activity' | 'idle' | 'unproductive'): string {
  if (type === 'activity') {
    if (pct >= 70) return 'stat-good';
    if (pct >= 40) return 'stat-warn';
    return 'stat-bad';
  }
  // idle / unproductive — lower is better
  if (pct <= 10) return 'stat-good';
  if (pct <= 30) return 'stat-warn';
  return 'stat-bad';
}

/** Convert seconds to HH:MM:SS */
export function secsToHMS(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Hook ──
export function useActivityStats() {
  const [status, setStatus] = useState<StatsStatus>('idle');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ActivityStats | null>(null);

  const fetchStats = useCallback(async (userId: string) => {
    const auth = getAuth();
    if (!auth) {
      setStatus('error');
      setError('No valid TimeDoctor token. Please fetch time worked first.');
      return;
    }

    setStatus('loading');
    setError('');
    setStats(null);

    const base = getV11BaseUrl();
    const authHeaders = { Authorization: `JWT ${auth.token}` };

    // Build date range: today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const params = new URLSearchParams({
      company: auth.companyId,
      user: userId,
      fields: TD_STATS_FIELDS,
      from: startOfDay.toISOString(),
      to: endOfDay.toISOString(),
      'group-by': 'userId',
      sort: 'modeTotal',
      limit: '200',
      token: auth.token,
    });

    const url = `${base}/stats/total?${params.toString()}`;

    try {
      const res = await fetch(url, { headers: authHeaders });

      if (!res.ok) {
        setStatus('error');
        setError(`Failed to fetch activity stats (HTTP ${res.status}).`);
        return;
      }

      const json = await res.json();

      if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
        setStatus('error');
        setError('No activity data for today.');
        return;
      }

      setStats(json.data[0] as ActivityStats);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Error fetching activity stats.');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
    setStats(null);
  }, []);

  return { status, error, stats, fetchStats, reset };
}
