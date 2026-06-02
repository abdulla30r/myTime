// ── App-facing data model for the FIFA World Cup 2026 module ──
// (adapted from MATCH_FEATURE spec §7 to this project's plain-TS/native-fetch stack)

export interface Team {
  /** football-data.org team id, or a synthetic negative id for bundled teams */
  id: number;
  name: string;
  /** 3-letter FIFA code, e.g. "BRA" — used for the monogram crest fallback */
  fifa: string;
  crestUrl?: string;
}

export type MatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'LIVE'
  | 'IN_PLAY'
  | 'PAUSED' // half-time
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface Goal {
  scorer: string;
  assist?: string;
  minute: number;
  isPenalty: boolean;
  isOwnGoal: boolean;
  isHome: boolean;
}

export type Stage =
  | 'GROUP_STAGE'
  | 'LAST_32'
  | 'LAST_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

export interface MatchResult {
  id: number;
  matchNo: number; // 1..104
  home: Team;
  away: Team;
  kickoffUtc: string; // ISO 8601 in UTC; convert with toBdTime() for display
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  stage: Stage;
  group?: string; // "A".."L" for group stage, undefined for knockout
  venue?: string;
  city?: string;
  goals: Goal[]; // [] when no events provider configured
  manOfTheMatch?: { name: string; rating?: number }; // undefined when unavailable
  /** true once enriched with per-match events from API-Football */
  detailLoaded?: boolean;
}

export type QualificationState =
  | 'QUALIFIED'
  | 'THIRD_PLACE_WATCH'
  | 'ELIMINATED'
  | 'UNKNOWN';

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualification: QualificationState;
}

export interface GroupTable {
  group: string; // "A".."L"
  rows: StandingRow[];
}

// ── Knockout ──
export interface BracketTeamSlot {
  team?: Team;
  isEliminated: boolean;
  score?: number;
  /** penalty-shootout score, when applicable */
  penalties?: number;
}

export interface KnockoutTie {
  id: number;
  matchNo: number;
  stage: Stage;
  order: number;
  kickoffUtc: string;
  status: MatchStatus;
  home: BracketTeamSlot;
  away: BracketTeamSlot;
  winnerTeamId?: number;
}

export interface Bracket {
  round32: KnockoutTie[];
  round16: KnockoutTie[];
  quarters: KnockoutTie[];
  semis: KnockoutTie[];
  thirdPlace?: KnockoutTie;
  final?: KnockoutTie;
}

export type DataSource = 'bundled' | 'live';
