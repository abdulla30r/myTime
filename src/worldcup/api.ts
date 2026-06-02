// ── Provider API client ──
// Provider #1 (backbone): football-data.org  → fixtures, scores, standings, bracket
// Provider #2 (optional):  API-Football       → per-match goals/assists + MOTM (by rating)
//
// All requests go to this app's OWN proxy (see vite.config.ts / server.js), which holds
// the secret token server-side (env) OR forwards a token the user pasted into Settings.

import type { MatchResult, MatchStatus, Stage, Team } from './types';
import { assignQualification } from './standings';
import type { GroupTable, StandingRow, Goal } from './types';

const FD_BASE = '/football-api';        // → https://api.football-data.org/v4
const AF_BASE = '/apifootball-api';     // → https://v3.football.api-sports.io

export const LS = {
  fdToken: 'wc_fdToken',
  fdEnv: 'wc_fdEnv',           // "1" → token is configured on the proxy via env var
  apiFootballKey: 'wc_apiFootballKey',
} as const;

export function hasFdAccess(): boolean {
  return !!localStorage.getItem(LS.fdToken) || localStorage.getItem(LS.fdEnv) === '1';
}
export function hasEventsAccess(): boolean {
  return !!localStorage.getItem(LS.apiFootballKey);
}

function fdHeaders(): Record<string, string> {
  const t = localStorage.getItem(LS.fdToken);
  return t ? { 'X-Auth-Token': t } : {};
}
function afHeaders(): Record<string, string> {
  const k = localStorage.getItem(LS.apiFootballKey);
  return k ? { 'x-apisports-key': k } : {};
}

async function fdGet(path: string): Promise<any> {
  const res = await fetch(`${FD_BASE}${path}`, { headers: fdHeaders() });
  if (!res.ok) throw new Error(`football-data.org HTTP ${res.status}`);
  return res.json();
}
async function afGet(path: string): Promise<any> {
  const res = await fetch(`${AF_BASE}${path}`, { headers: afHeaders() });
  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
  return res.json();
}

// ── football-data.org → app model mappers ──
function mapStatus(s: string): MatchStatus {
  const u = (s || '').toUpperCase();
  const known: MatchStatus[] = ['SCHEDULED', 'TIMED', 'LIVE', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'SUSPENDED', 'CANCELLED'];
  return (known.includes(u as MatchStatus) ? u : 'SCHEDULED') as MatchStatus;
}

function mapStage(s: string): Stage {
  const u = (s || '').toUpperCase();
  const known: Stage[] = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];
  return (known.includes(u as Stage) ? u : 'GROUP_STAGE') as Stage;
}

function groupLetter(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/([A-L])\s*$/i); // "GROUP_A" / "Group A" → "A"
  return m ? m[1].toUpperCase() : undefined;
}

function mapTeam(t: any): Team {
  return {
    id: t?.id ?? -1,
    name: t?.name ?? t?.shortName ?? 'TBD',
    fifa: (t?.tla || t?.shortName || (t?.name ?? '??').slice(0, 3)).toUpperCase(),
    crestUrl: t?.crest || undefined,
  };
}

export async function getLiveMatches(): Promise<MatchResult[]> {
  const json = await fdGet('/competitions/WC/matches');
  const raw: any[] = Array.isArray(json?.matches) ? json.matches : [];
  const mapped: MatchResult[] = raw.map((m) => ({
    id: m.id,
    matchNo: 0,
    home: mapTeam(m.homeTeam),
    away: mapTeam(m.awayTeam),
    kickoffUtc: m.utcDate,
    status: mapStatus(m.status),
    homeScore: m.score?.fullTime?.home ?? undefined,
    awayScore: m.score?.fullTime?.away ?? undefined,
    stage: mapStage(m.stage),
    group: groupLetter(m.group),
    venue: m.venue || undefined,
    goals: [],
  }));
  mapped.sort((a, b) => +new Date(a.kickoffUtc) - +new Date(b.kickoffUtc));
  mapped.forEach((m, i) => { m.matchNo = i + 1; });
  return mapped;
}

export async function getLiveStandings(): Promise<GroupTable[] | null> {
  const json = await fdGet('/competitions/WC/standings');
  const raw: any[] = Array.isArray(json?.standings) ? json.standings : [];
  const totals = raw.filter((s) => (s.type || 'TOTAL') === 'TOTAL');
  if (totals.length === 0) return null;

  const tables: GroupTable[] = totals.map((s) => {
    const group = groupLetter(s.group) ?? '?';
    const rows: StandingRow[] = (s.table ?? []).map((r: any) => ({
      position: r.position,
      team: mapTeam(r.team),
      played: r.playedGames ?? 0,
      won: r.won ?? 0,
      drawn: r.draw ?? 0,
      lost: r.lost ?? 0,
      goalsFor: r.goalsFor ?? 0,
      goalsAgainst: r.goalsAgainst ?? 0,
      goalDifference: r.goalDifference ?? 0,
      points: r.points ?? 0,
      qualification: 'UNKNOWN',
    }));
    return { group, rows };
  }).filter((t) => t.group !== '?')
    .sort((a, b) => a.group.localeCompare(b.group));

  assignQualification(tables);
  return tables;
}

// ── API-Football: per-match events + Man of the Match (by rating) ──
// Provider ids differ, so we load the WC fixtures index once and match by team + date.

const AF_LEAGUE_WC = 1; // FIFA World Cup
const AF_SEASON = 2026;
interface AfFixture { fixtureId: number; home: string; away: string; date: string }
let afIndex: AfFixture[] | null = null;

function norm(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}
// bidirectional aliases for provider naming differences that substring-matching misses
const ALIAS_PAIRS: [string, string][] = [
  ['southkorea', 'korearepublic'],
  ['unitedstates', 'usa'],
  ['turkey', 'turkiye'],
  ['ivorycoast', 'cotedivoire'],
  ['drcongo', 'congodr'],
  ['czechrepublic', 'czechia'],
];
const ALIASES = new Map<string, string>();
ALIAS_PAIRS.forEach(([a, b]) => { ALIASES.set(a, b); ALIASES.set(b, a); });

function teamMatches(a: string, b: string): boolean {
  const na = norm(a); const nb = norm(b);
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return ALIASES.get(na) === nb;
}

async function ensureAfIndex(): Promise<void> {
  if (afIndex) return;
  const cacheKey = `wc_afIndex_${AF_SEASON}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) { afIndex = JSON.parse(cached) as AfFixture[]; return; }
  } catch { /* ignore */ }

  const json = await afGet(`/fixtures?league=${AF_LEAGUE_WC}&season=${AF_SEASON}`);
  const list: any[] = Array.isArray(json?.response) ? json.response : [];
  afIndex = list.map((f): AfFixture => ({
    fixtureId: f.fixture?.id,
    date: f.fixture?.date ?? '',
    home: f.teams?.home?.name ?? '',
    away: f.teams?.away?.name ?? '',
  }));
  try { localStorage.setItem(cacheKey, JSON.stringify(afIndex)); } catch { /* ignore */ }
}

function findFixtureId(match: MatchResult): number | null {
  if (!afIndex) return null;
  const dayUtc = match.kickoffUtc.slice(0, 10);
  const cand = afIndex.find((f) =>
    f.date.slice(0, 10) === dayUtc &&
    teamMatches(f.home, match.home.name) && teamMatches(f.away, match.away.name));
  if (cand) return cand.fixtureId;
  // looser: ignore date (tz drift) and match teams only
  const loose = afIndex.find((f) => teamMatches(f.home, match.home.name) && teamMatches(f.away, match.away.name));
  return loose ? loose.fixtureId : null;
}

export interface MatchDetail {
  goals: Goal[];
  manOfTheMatch?: { name: string; rating?: number };
}

export async function loadMatchDetail(match: MatchResult): Promise<MatchDetail> {
  await ensureAfIndex();
  const fixtureId = findFixtureId(match);
  if (!fixtureId) throw new Error('No API-Football fixture matched this game');

  const [eventsJson, playersJson] = await Promise.all([
    afGet(`/fixtures/events?fixture=${fixtureId}`),
    afGet(`/fixtures/players?fixture=${fixtureId}`),
  ]);

  // goals + assists
  const homeName = match.home.name;
  const events: any[] = Array.isArray(eventsJson?.response) ? eventsJson.response : [];
  const goals: Goal[] = events
    .filter((e) => e.type === 'Goal')
    .map((e) => {
      const detail: string = e.detail || '';
      const isHome = teamMatches(e.team?.name ?? '', homeName);
      const isOwnGoal = /own goal/i.test(detail);
      return {
        scorer: e.player?.name ?? 'Unknown',
        assist: e.assist?.name || undefined,
        minute: (e.time?.elapsed ?? 0) + (e.time?.extra ?? 0),
        isPenalty: /penalty/i.test(detail),
        isOwnGoal,
        // own goal counts for the opponent
        isHome: isOwnGoal ? !isHome : isHome,
      } as Goal;
    })
    .sort((a, b) => a.minute - b.minute);

  // MOTM = highest player rating across both squads
  let motm: { name: string; rating?: number } | undefined;
  const squads: any[] = Array.isArray(playersJson?.response) ? playersJson.response : [];
  let best = -1;
  squads.forEach((sq) => {
    (sq.players ?? []).forEach((p: any) => {
      const r = parseFloat(p.statistics?.[0]?.games?.rating ?? '');
      if (!Number.isNaN(r) && r > best) { best = r; motm = { name: p.player?.name ?? 'Unknown', rating: r }; }
    });
  });

  return { goals, manOfTheMatch: motm };
}
