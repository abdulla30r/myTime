import { useState, useCallback } from 'react';

// ── Types ──
export interface RAMSRecord {
  name: string;
  firstIn: string;
}

export type RAMSStatus = 'idle' | 'loading' | 'success' | 'error';

const LS_RAMS_EMPLOYEE = 'myTime_ramsEmployee';

// ── API paths (proxied by Vite / Apache) ──
const RAMS_LOGIN_URL = '/rams-api/user/login';
const RAMS_DATA_URL = '/rams-api/get_first_in_last_out_log2';

/** Extract CSRF _formkey from RAMS login page HTML */
function extractFormKey(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const input = doc.querySelector<HTMLInputElement>('input[name="_formkey"]');
  return input?.value ?? null;
}

/**
 * Parse RAMS attendance HTML table.
 * Columns: [0] expand | [1] Name | [2] Phone | [3] Dept
 *          [4] Date | [5] In Device | [6] First In | [7] Out Device
 *          [8] Last Out | [9] ? | [10] Duration
 */
function parseRAMSTable(html: string): RAMSRecord[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('table tbody tr');
  const records: RAMSRecord[] = [];
  const seen = new Set<string>();

  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7) {
      const name = cells[1]?.textContent?.trim() ?? '';
      const firstIn = cells[6]?.textContent?.trim() ?? '';

      if (
        name &&
        firstIn &&
        firstIn !== '-' &&
        /^\d{1,2}:\d{2}(:\d{2})?$/.test(firstIn) &&
        !seen.has(name)
      ) {
        seen.add(name);
        records.push({ name, firstIn });
      }
    }
  });

  return records;
}

export function useRAMS() {
  const [username] = useState('avianbpo');
  const [password] = useState('password123');
  const [status, setStatus] = useState<RAMSStatus>('idle');
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<RAMSRecord[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
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

  const fetchAttendance = useCallback(async (onAutoApply?: (h: number, m: number) => void) => {
    if (!username.trim() || !password.trim()) {
      setStatus('error');
      setMessage('Please enter both username and password.');
      return;
    }

    setStatus('loading');
    setMessage('Connecting to RAMS...');
    setRecords([]);
    setSelectedTime('');

    try {
      // Step 1: GET login page for CSRF token
      const loginPageRes = await fetch(RAMS_LOGIN_URL);
      if (!loginPageRes.ok) throw new Error(`Could not reach RAMS (HTTP ${loginPageRes.status})`);

      const loginHtml = await loginPageRes.text();
      const formKey = extractFormKey(loginHtml);
      if (!formKey) throw new Error('Could not extract login token.');

      setMessage('Logging in...');

      // Step 2: POST login
      const body = new URLSearchParams({
        username: username.trim(),
        password: password.trim(),
        _next: '/rams/get_first_in_last_out_log2',
        _formkey: formKey,
        _formname: 'login',
      });

      const loginRes = await fetch(RAMS_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'follow',
      });

      const resultHtml = await loginRes.text();

      if (resultHtml.includes('Invalid login') || resultHtml.includes('invalid credentials')) {
        setStatus('error');
        setMessage('Invalid username or password.');
        return;
      }

      // Try parsing from redirect response
      let parsed = parseRAMSTable(resultHtml);

      // If empty, fetch data page explicitly
      if (parsed.length === 0) {
        setMessage('Fetching attendance data...');
        const dataRes = await fetch(RAMS_DATA_URL);
        if (!dataRes.ok) throw new Error(`Could not fetch attendance data (HTTP ${dataRes.status})`);
        const dataHtml = await dataRes.text();

        if (dataHtml.includes('name="_formname" value="login"')) {
          throw new Error('Session expired. Please try again.');
        }
        parsed = parseRAMSTable(dataHtml);
      }

      if (parsed.length === 0) {
        setStatus('error');
        setMessage('No attendance records with First-In time found for today.');
        return;
      }

      setRecords(parsed);

      // If we have a saved employee, auto-match and signal auto-apply
      if (savedEmployee) {
        const match = parsed.find((r) => r.name === savedEmployee);
        if (match) {
          const parts = match.firstIn.split(':');
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m)) {
            if (onAutoApply) onAutoApply(h, m);
            setStatus('success');
            setMessage(`${match.name} — ${match.firstIn}`);
            return;
          }
        }
        // Saved name not found today — fall back to dropdown
        setStatus('success');
        setMessage(`Saved employee not found today. Select below.`);
        return;
      }

      setStatus('success');
      setMessage(`Found ${parsed.length} records. Select your name.`);
    } catch (err) {
      console.error('RAMS fetch error:', err);
      setStatus('error');
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [username, password]);

  return {
    status,
    message,
    records,
    selectedTime,
    setSelectedTime,
    fetchAttendance,
    hasSavedEmployee,
    savedEmployee,
    saveEmployee,
    clearSavedEmployee,
  };
}
