// ── Build the knockout Bracket model from fixtures ──

import type { Bracket, BracketTeamSlot, KnockoutTie, MatchResult, Stage } from './types';
import { isFinished } from './time';

function toTie(m: MatchResult, order: number): KnockoutTie {
  const finished = isFinished(m.status) && m.homeScore != null && m.awayScore != null;
  let winnerTeamId: number | undefined;
  let homeOut = false;
  let awayOut = false;

  if (finished) {
    if (m.homeScore! > m.awayScore!) { winnerTeamId = m.home.id; awayOut = true; }
    else if (m.awayScore! > m.homeScore!) { winnerTeamId = m.away.id; homeOut = true; }
    // equal at FT → decided by ET/penalties; winner left undefined without shootout data
  }

  const isReal = (t: MatchResult['home']) => t.fifa !== '?' && t.name !== 'TBD';

  const home: BracketTeamSlot = {
    team: isReal(m.home) ? m.home : undefined,
    isEliminated: homeOut,
    score: finished ? m.homeScore : undefined,
  };
  const away: BracketTeamSlot = {
    team: isReal(m.away) ? m.away : undefined,
    isEliminated: awayOut,
    score: finished ? m.awayScore : undefined,
  };

  return {
    id: m.id, matchNo: m.matchNo, stage: m.stage, order,
    kickoffUtc: m.kickoffUtc, status: m.status, home, away, winnerTeamId,
  };
}

function tiesForStage(fixtures: MatchResult[], stage: Stage): KnockoutTie[] {
  return fixtures
    .filter((m) => m.stage === stage)
    .sort((a, b) => a.matchNo - b.matchNo)
    .map((m, i) => toTie(m, i + 1));
}

export function buildBracket(fixtures: MatchResult[]): Bracket {
  return {
    round32: tiesForStage(fixtures, 'LAST_32'),
    round16: tiesForStage(fixtures, 'LAST_16'),
    quarters: tiesForStage(fixtures, 'QUARTER_FINALS'),
    semis: tiesForStage(fixtures, 'SEMI_FINALS'),
    thirdPlace: tiesForStage(fixtures, 'THIRD_PLACE')[0],
    final: tiesForStage(fixtures, 'FINAL')[0],
  };
}

export const hasKnockoutData = (b: Bracket): boolean =>
  b.round32.some((t) => t.home.team || t.away.team) ||
  b.round16.length > 0 || b.final?.home.team != null;
