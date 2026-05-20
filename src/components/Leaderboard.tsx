import { useMemo } from 'react';
import type { LeaderboardData } from './FetchPanel';

interface Props {
  data: LeaderboardData | null;
  currentEmployee?: string;
}

function stripId(name: string): string {
  return name.replace(/\s*\(.*\)/, '');
}

function firstInToMinutes(firstIn: string): number {
  const [h, m] = firstIn.split(':');
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  if (isNaN(hh) || isNaN(mm)) return Number.POSITIVE_INFINITY;
  return hh * 60 + mm;
}

export function Leaderboard({ data, currentEmployee }: Props) {
  const meClean = currentEmployee ? stripId(currentEmployee) : '';

  const arrivals = useMemo(() => {
    if (!data) return [];
    return [...data.rams].sort(
      (a, b) => firstInToMinutes(a.firstIn) - firstInToMinutes(b.firstIn),
    );
  }, [data]);

  const topTd = useMemo(() => {
    if (!data) return [];
    return data.td.filter((r) => r.seconds > 0); // already sorted desc by hook
  }, [data]);

  const isLoading =
    !data || data.ramsStatus === 'loading' || data.tdStatus === 'loading';

  return (
    <section className="leaderboard">
      <h2 className="leaderboard__title">🏆 Leaderboard</h2>

      {isLoading && (
        <div className="leaderboard__loading">
          <span className="refresh-spinner" />
          <span>Loading leaderboard data…</span>
        </div>
      )}

      <div className="leaderboard__grid">
        {/* ── Arrivals ── */}
        <div className="leaderboard__card">
          <div className="leaderboard__card-header">
            <span className="leaderboard__card-icon">🚪</span>
            <h3 className="leaderboard__card-title">First to Last Arrival</h3>
            <span className="leaderboard__card-count">{arrivals.length}</span>
          </div>

          {arrivals.length === 0 && !isLoading ? (
            <div className="leaderboard__empty">No attendance records.</div>
          ) : (
            <ol className="leaderboard__list">
              {arrivals.map((r, i) => {
                const clean = stripId(r.name);
                const isMe = meClean !== '' && clean === meClean;
                const rankClass =
                  i === 0
                    ? 'leaderboard__rank--gold'
                    : i === 1
                      ? 'leaderboard__rank--silver'
                      : i === 2
                        ? 'leaderboard__rank--bronze'
                        : '';
                return (
                  <li
                    key={r.name}
                    className={`leaderboard__row${isMe ? ' leaderboard__row--me' : ''}`}
                  >
                    <span className={`leaderboard__rank ${rankClass}`}>
                      {i + 1}
                    </span>
                    <span className="leaderboard__name">{clean}</span>
                    <span className="leaderboard__value">{r.firstIn}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* ── Top Time Doctor ── */}
        <div className="leaderboard__card">
          <div className="leaderboard__card-header">
            <span className="leaderboard__card-icon">🖥</span>
            <h3 className="leaderboard__card-title">Top Mr Time</h3>
            <span className="leaderboard__card-count">{topTd.length}</span>
          </div>

          {topTd.length === 0 && !isLoading ? (
            <div className="leaderboard__empty">No tracked time yet.</div>
          ) : (
            <ol className="leaderboard__list">
              {topTd.map((r, i) => {
                const isMe = meClean !== '' && r.name.toLowerCase() === meClean.toLowerCase();
                const rankClass =
                  i === 0
                    ? 'leaderboard__rank--gold'
                    : i === 1
                      ? 'leaderboard__rank--silver'
                      : i === 2
                        ? 'leaderboard__rank--bronze'
                        : '';
                return (
                  <li
                    key={r.userId}
                    className={`leaderboard__row${isMe ? ' leaderboard__row--me' : ''}`}
                  >
                    <span className={`leaderboard__rank ${rankClass}`}>
                      {i + 1}
                    </span>
                    <span className="leaderboard__name">{r.name}</span>
                    <span className="leaderboard__value">{r.timeWorked}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
