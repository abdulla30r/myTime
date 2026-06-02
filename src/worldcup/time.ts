// ── Bangladesh-time helpers + office/home watch classification ──
// Dhaka is UTC+6 with no DST, so all conversions are exact and stable.

import type { MatchStatus } from './types';

const TZ = 'Asia/Dhaka';

const fullFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  weekday: 'short', day: '2-digit', month: 'short',
  hour: '2-digit', minute: '2-digit', hour12: true,
});

const dayFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, weekday: 'long', day: '2-digit', month: 'short',
});

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true,
});

const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }); // → "2026-06-14"

/** "Sun, 14 Jun, 10:00 pm" */
export const toBdTime = (utcIso: string) => fullFmt.format(new Date(utcIso));

/** Group key by the Dhaka calendar date, e.g. "2026-06-14" */
export const bdDateKey = (utcIso: string) => keyFmt.format(new Date(utcIso));

/** "Sunday, 14 Jun" — section header */
export const bdDayLabel = (utcIso: string) => dayFmt.format(new Date(utcIso));

/** "10:00 pm" */
export const bdTimeOnly = (utcIso: string) => timeFmt.format(new Date(utcIso));

// ── Office vs home: 🏢 = Sat–Thu 09:00–19:00 Dhaka; Fri (or any night/early AM) = 🏠 ──
const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, weekday: 'short', hour: '2-digit', hour12: false,
});

export type WatchWhere = 'office' | 'home';

export interface WatchInfo {
  where: WatchWhere;
  icon: string;
  label: string;
}

export function classifyWatch(utcIso: string): WatchInfo {
  const parts = partsFmt.formatToParts(new Date(utcIso));
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  let hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  if (hour === 24) hour = 0; // en-US hour12:false can emit "24" at midnight

  const isFriday = weekday === 'Fri';
  const inOfficeHours = hour >= 9 && hour < 19;

  if (!isFriday && inOfficeHours) {
    return { where: 'office', icon: '🏢', label: 'Watch at office' };
  }
  return { where: 'home', icon: '🏠', label: 'Watch at home' };
}

// ── Status helpers (covers both football-data.org and API-Football vocab) ──
export const isLive = (s: MatchStatus) => s === 'LIVE' || s === 'IN_PLAY' || s === 'PAUSED';
export const isFinished = (s: MatchStatus) => s === 'FINISHED';
export const isUpcoming = (s: MatchStatus) => s === 'SCHEDULED' || s === 'TIMED';

export function statusLabel(s: MatchStatus, minute?: number): string {
  switch (s) {
    case 'FINISHED': return 'FT';
    case 'PAUSED': return 'HT';
    case 'LIVE':
    case 'IN_PLAY': return minute != null ? `LIVE ${minute}'` : 'LIVE';
    case 'POSTPONED': return 'POSTPONED';
    case 'SUSPENDED': return 'SUSPENDED';
    case 'CANCELLED': return 'CANCELLED';
    default: return 'SCHEDULED';
  }
}
