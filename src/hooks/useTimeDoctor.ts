import { useState, useCallback } from 'react';

// ── Types ──
export type TDStatus = 'idle' | 'loading' | 'success' | 'error';

export interface TDRecord {
  name: string;
  timeWorked: string;
  seconds: number;
  userId: string;
}

// ── Hardcoded credentials (admin account with all-user access) ──
const TD_EMAIL = 'arshil.azim@avianbpo.com';
const TD_PASSWORD = 'Noshortcut1.';

// ── localStorage keys ──
const LS_TD_TOKEN = 'myTime_tdToken';
const LS_TD_COMPANY = 'myTime_tdCompanyId';
const LS_TD_USER = 'myTime_tdUserId';
const LS_TD_TOKEN_TIME = 'myTime_tdTokenTime';
const LS_TD_EMPLOYEE = 'myTime_tdEmployee';

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

// ── Strategy runner (multi-user) ──
async function tryStrategy(
  baseUrl: string,
  email: string,
  password: string,
  storedAuth: { token: string; companyId: string; userId: string } | null,
): Promise<{ records: TDRecord[]; auth: { token: string; companyId: string; userId: string } }> {
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

  const authHeaders = { Authorization: `JWT ${auth.token}` };
  const tokenParam = `&token=${auth.token}`;

  // Fetch all users in the company
  const usersUrl = `${baseUrl}/users?company=${auth.companyId}&limit=200${tokenParam}`;
  const usersRes = await fetch(usersUrl, { headers: authHeaders });

  const userMap: Record<string, string> = {};
  const userIds: string[] = [];
  let isAdmin = false;

  if (usersRes.ok) {
    const usersData = await usersRes.json();
    const userList = usersData.data || usersData;

    if (Array.isArray(userList) && userList.length > 1) {
      isAdmin = true;
      userList.forEach((u: any) => {
        const uid = u.id || u.userId || u._id;
        const name = u.name || u.fullName || u.email || uid;
        if (uid && u.active !== false) {
          userMap[uid] = name;
          userIds.push(uid);
        }
      });
    } else if (Array.isArray(userList) && userList.length === 1) {
      const u = userList[0];
      const uid = u.id || u.userId || u._id;
      userMap[uid] = u.name || u.fullName || u.email || uid;
      userIds.push(uid);
    }
  }

  if (userIds.length === 0) {
    userIds.push(auth.userId);
    userMap[auth.userId] = email;
  }

  // Fetch today's worklog for all users
  const date = todayStr();
  const userParam = isAdmin ? userIds.join(',') : auth.userId;

  const worklogUrl = `${baseUrl}/activity/worklog?company=${auth.companyId}&user=${userParam}&from=${date}T00:00:00&to=${date}T23:59:59${tokenParam}`;
  const worklogRes = await fetch(worklogUrl, { headers: authHeaders });

  if (worklogRes.status === 401 || worklogRes.status === 403) {
    localStorage.removeItem(LS_TD_TOKEN);
    throw new Error('Token expired');
  }
  if (!worklogRes.ok) throw new Error(`Worklog HTTP ${worklogRes.status}`);

  const worklogData = await worklogRes.json();

  // Sum time per userId
  const perUser: Record<string, number> = {};

  if (worklogData.data && Array.isArray(worklogData.data)) {
    worklogData.data.forEach((item: any) => {
      const entries: any[] = Array.isArray(item) ? item : [item];
      entries.forEach((entry: any) => {
        const uid = entry.userId || auth!.userId;
        if (!perUser[uid]) perUser[uid] = 0;

        if (entry.time && typeof entry.time === 'number') perUser[uid] += entry.time;
        else if (entry.duration && typeof entry.duration === 'number') perUser[uid] += entry.duration;
        else if (entry.total && typeof entry.total === 'number') perUser[uid] += entry.total;
      });
    });
  }

  // Build records for users with tracked time, sorted descending
  const records: TDRecord[] = userIds
    .filter((uid) => (perUser[uid] || 0) > 0)
    .map((uid) => ({
      name: userMap[uid] || uid,
      timeWorked: secondsToHMS(perUser[uid]),
      seconds: perUser[uid],
      userId: uid,
    }))
    .sort((a, b) => b.seconds - a.seconds);

  if (records.length === 0) {
    const err = new Error('No tracked time found for today.');
    (err as any).isEmptyData = true;
    throw err;
  }

  return { records, auth };
}

// ── Hook ──
export function useTimeDoctor() {
  const [status, setStatus] = useState<TDStatus>('idle');
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<TDRecord[]>([]);
  const [savedEmployee, setSavedEmployee] = useState<string>(() => {
    try { return localStorage.getItem(LS_TD_EMPLOYEE) ?? ''; } catch { return ''; }
  });
  const hasSavedEmployee = savedEmployee !== '';

  const saveEmployee = (name: string) => {
    try { localStorage.setItem(LS_TD_EMPLOYEE, name); } catch { /* ignore */ }
    setSavedEmployee(name);
  };

  const clearSavedEmployee = () => {
    try { localStorage.removeItem(LS_TD_EMPLOYEE); } catch { /* ignore */ }
    setSavedEmployee('');
  };

  const fetchTimeDoctor = useCallback(
    async (onAutoApply?: (hours: number, minutes: number) => void) => {
      setStatus('loading');
      setMessage('Connecting...');
      setRecords([]);

      const storedAuth = getSavedToken();
      let lastError: Error | null = null;

      for (let i = 0; i < TD_STRATEGIES.length; i++) {
        const strategy = TD_STRATEGIES[i];
        setMessage(`${i === 0 ? 'Connecting' : 'Retrying'} via ${strategy.name}...`);

        try {
          const result = await tryStrategy(strategy.baseUrl, TD_EMAIL, TD_PASSWORD, storedAuth);

          setRecords(result.records);
          setStatus('success');
          setMessage(`Found ${result.records.length} employee(s) with tracked time. Select below.`);

          // Auto-apply if we have a saved employee
          const saved = localStorage.getItem(LS_TD_EMPLOYEE) ?? '';
          if (saved && onAutoApply) {
            const match = result.records.find((r) => r.name === saved);
            if (match) {
              const hours = Math.floor(match.seconds / 3600);
              const minutes = Math.floor((match.seconds % 3600) / 60);
              onAutoApply(hours, minutes);
              setMessage(`Applied: ${match.name} — ${match.timeWorked}`);
            }
          }

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
    records,
    fetchTimeDoctor,
    hasSavedEmployee,
    saveEmployee,
    clearSavedEmployee,
  };
}
