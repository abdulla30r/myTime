import { useMemo, useState } from 'react';
import type { MatchResult, Stage } from '../types';
import { bdDateKey, bdDayLabel, bdTimeOnly, classifyWatch, isLive, isFinished } from '../time';
import { TeamCrest, StatusBadge, WatchBadge } from './badges';

type Quick = 'all' | 'today' | 'live' | 'office';

const STAGE_LABELS: Record<Stage, string> = {
  GROUP_STAGE: 'Group stage',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  THIRD_PLACE: 'Third place',
  FINAL: 'Final',
};

const STAGES: Stage[] = ['GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

function FixtureRow({ match, onOpen }: { match: MatchResult; onOpen: (m: MatchResult) => void }) {
  const watch = classifyWatch(match.kickoffUtc);
  const finished = isFinished(match.status);
  const live = isLive(match.status);
  const showScore = finished || live;
  const homeWon = finished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWon = finished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <button className="wc-fixture" onClick={() => onOpen(match)}>
      <span className="wc-fixture__time">{bdTimeOnly(match.kickoffUtc)}</span>

      <span className={`wc-fixture__team wc-fixture__team--home${awayWon ? ' wc-fixture__team--lost' : ''}`}>
        <span className="wc-fixture__name">{match.home.name}</span>
        <TeamCrest team={match.home} />
      </span>

      <span className="wc-fixture__score">
        {showScore ? (
          <span className="wc-fixture__score-nums">
            <b className={homeWon ? 'wc-win' : ''}>{match.homeScore ?? 0}</b>
            <span className="wc-fixture__dash">–</span>
            <b className={awayWon ? 'wc-win' : ''}>{match.awayScore ?? 0}</b>
          </span>
        ) : (
          <span className="wc-fixture__vs">v</span>
        )}
      </span>

      <span className={`wc-fixture__team wc-fixture__team--away${homeWon ? ' wc-fixture__team--lost' : ''}`}>
        <TeamCrest team={match.away} />
        <span className="wc-fixture__name">{match.away.name}</span>
      </span>

      <span className="wc-fixture__meta">
        <StatusBadge status={match.status} />
        {match.group && <span className="wc-fixture__group">Grp {match.group}</span>}
        <WatchBadge info={watch} />
      </span>
    </button>
  );
}

export function Fixtures({ fixtures, onOpen }: { fixtures: MatchResult[]; onOpen: (m: MatchResult) => void }) {
  const [quick, setQuick] = useState<Quick>('all');
  const [stage, setStage] = useState<Stage | 'ALL'>('ALL');
  const [group, setGroup] = useState<string>('ALL');

  const todayKey = bdDateKey(new Date().toISOString());

  const filtered = useMemo(() => {
    return fixtures.filter((m) => {
      if (quick === 'today' && bdDateKey(m.kickoffUtc) !== todayKey) return false;
      if (quick === 'live' && !isLive(m.status)) return false;
      if (quick === 'office' && classifyWatch(m.kickoffUtc).where !== 'office') return false;
      if (stage !== 'ALL' && m.stage !== stage) return false;
      if (group !== 'ALL' && m.group !== group) return false;
      return true;
    });
  }, [fixtures, quick, stage, group, todayKey]);

  // group by Bangladesh calendar day
  const byDay = useMemo(() => {
    const map = new Map<string, MatchResult[]>();
    [...filtered]
      .sort((a, b) => +new Date(a.kickoffUtc) - +new Date(b.kickoffUtc))
      .forEach((m) => {
        const key = bdDateKey(m.kickoffUtc);
        const arr = map.get(key) ?? [];
        if (!map.has(key)) map.set(key, arr);
        arr.push(m);
      });
    return [...map.entries()];
  }, [filtered]);

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div className="wc-fixtures">
      <div className="wc-filters">
        <div className="wc-pills">
          {(['all', 'today', 'live', 'office'] as Quick[]).map((q) => (
            <button
              key={q}
              className={`wc-pill${quick === q ? ' wc-pill--active' : ''}`}
              onClick={() => setQuick(q)}
            >
              {q === 'all' ? 'All' : q === 'today' ? 'Today' : q === 'live' ? '🔴 Live' : '🏢 Office'}
            </button>
          ))}
        </div>
        <div className="wc-selects">
          <select className="wc-select" value={stage} onChange={(e) => setStage(e.target.value as Stage | 'ALL')}>
            <option value="ALL">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <select className="wc-select" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="ALL">All groups</option>
            {groups.map((g) => <option key={g} value={g}>Group {g}</option>)}
          </select>
        </div>
      </div>

      {byDay.length === 0 && <div className="wc-empty">No matches match these filters.</div>}

      {byDay.map(([key, matches]) => (
        <section key={key} className="wc-day">
          <h3 className="wc-day__header">
            {bdDayLabel(matches[0].kickoffUtc)}
            <span className="wc-day__count">{matches.length} match{matches.length > 1 ? 'es' : ''}</span>
          </h3>
          <div className="wc-day__list">
            {matches.map((m) => <FixtureRow key={m.id} match={m} onOpen={onOpen} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
