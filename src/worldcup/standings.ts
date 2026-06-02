// ── Group point tables + qualification/elimination logic ──

import type { GroupTable, MatchResult, StandingRow, Team } from './types';
import { GROUPS } from './data';
import { isFinished } from './time';

function blankRow(team: Team): StandingRow {
  return {
    position: 0, team,
    played: 0, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    qualification: 'UNKNOWN',
  };
}

function sortRows(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) =>
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.team.name.localeCompare(b.team.name),
  );
}

/** Build group tables from fixtures (used as the offline / fallback path). */
export function computeStandings(fixtures: MatchResult[]): GroupTable[] {
  const byGroup: Record<string, Map<number, StandingRow>> = {};

  // seed every group with its 4 teams so empty groups still render
  GROUPS.forEach((g) => {
    byGroup[g.group] = new Map();
  });

  // seed rows from the fixtures' teams (keeps live team objects/crests when present)
  fixtures.forEach((m) => {
    if (m.stage !== 'GROUP_STAGE' || !m.group) return;
    const grp = (byGroup[m.group] ??= new Map());
    if (!grp.has(m.home.id) && m.home.fifa !== '?') grp.set(m.home.id, blankRow(m.home));
    if (!grp.has(m.away.id) && m.away.fifa !== '?') grp.set(m.away.id, blankRow(m.away));
  });

  // tally finished results
  fixtures.forEach((m) => {
    if (m.stage !== 'GROUP_STAGE' || !m.group) return;
    if (!isFinished(m.status) || m.homeScore == null || m.awayScore == null) return;
    const grp = byGroup[m.group];
    const h = grp.get(m.home.id);
    const a = grp.get(m.away.id);
    if (!h || !a) return;

    h.played += 1; a.played += 1;
    h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) { h.won += 1; h.points += 3; a.lost += 1; }
    else if (m.homeScore < m.awayScore) { a.won += 1; a.points += 3; h.lost += 1; }
    else { h.drawn += 1; a.drawn += 1; h.points += 1; a.points += 1; }
  });

  const tables: GroupTable[] = Object.keys(byGroup).sort().map((group) => {
    const rows = sortRows([...byGroup[group].values()]);
    rows.forEach((r, i) => {
      r.position = i + 1;
      r.goalDifference = r.goalsFor - r.goalsAgainst;
    });
    return { group, rows };
  });

  assignQualification(tables);
  return tables;
}

/** Map a live football-data.org standings payload (already sorted) into GroupTable[]. */
export function assignQualification(tables: GroupTable[]): void {
  const completedThirds: StandingRow[] = [];
  let allComplete = true;

  tables.forEach((t) => {
    t.rows.forEach((r) => { r.goalDifference = r.goalsFor - r.goalsAgainst; });
    const groupComplete = t.rows.length === 4 && t.rows.every((r) => r.played >= 3);
    if (!groupComplete) { allComplete = false; }

    t.rows.forEach((r, i) => {
      if (!groupComplete) { r.qualification = 'UNKNOWN'; return; }
      if (i < 2) r.qualification = 'QUALIFIED';
      else if (i === 2) { r.qualification = 'THIRD_PLACE_WATCH'; completedThirds.push(r); }
      else r.qualification = 'ELIMINATED';
    });
  });

  // 8 best third-placed teams advance; once all 12 groups are done, eliminate the worst 4
  if (allComplete && completedThirds.length === 12) {
    const ranked = sortRows(completedThirds);
    ranked.slice(8).forEach((r) => { r.qualification = 'ELIMINATED'; });
    ranked.slice(0, 8).forEach((r) => { r.qualification = 'QUALIFIED'; });
  }
}
