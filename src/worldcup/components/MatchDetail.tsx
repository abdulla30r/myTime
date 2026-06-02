import { useEffect } from 'react';
import type { MatchResult } from '../types';
import type { MatchDetailState } from '../useWorldCup';
import { toBdTime, classifyWatch, isFinished, isLive, statusLabel } from '../time';
import { TeamCrest, WatchBadge } from './badges';

interface Props {
  match: MatchResult;
  detail?: MatchDetailState;
  eventsEnabled: boolean;
  onLoad: (m: MatchResult) => void;
  onClose: () => void;
}

export function MatchDetail({ match, detail, eventsEnabled, onLoad, onClose }: Props) {
  const finished = isFinished(match.status);
  const live = isLive(match.status);
  const showScore = finished || live;
  const watch = classifyWatch(match.kickoffUtc);

  useEffect(() => {
    if (eventsEnabled && finished && (!detail || detail.status === 'idle')) onLoad(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  const goals = detail?.goals ?? match.goals;
  const homeGoals = goals.filter((g) => g.isHome);
  const awayGoals = goals.filter((g) => !g.isHome);
  const motm = detail?.motm ?? match.manOfTheMatch;

  const goalLine = (g: typeof goals[number]) => (
    <li key={`${g.scorer}-${g.minute}`} className="wc-goal">
      <span className="wc-goal__min">{g.minute}'</span>
      <span className="wc-goal__scorer">
        ⚽ {g.scorer}
        {g.isPenalty && <em className="wc-goal__tag"> (pen)</em>}
        {g.isOwnGoal && <em className="wc-goal__tag"> (OG)</em>}
      </span>
      {g.assist && <span className="wc-goal__assist">assist: {g.assist}</span>}
    </li>
  );

  return (
    <div className="wc-modal" onClick={onClose}>
      <div className="wc-modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="wc-modal__close" onClick={onClose}>✕</button>

        <div className="wc-modal__stage">
          {match.group ? `Group ${match.group}` : ''} {match.city ? `· ${match.city}` : ''}
        </div>

        <div className="wc-scoreboard">
          <div className="wc-scoreboard__team">
            <TeamCrest team={match.home} size={48} />
            <span className="wc-scoreboard__name">{match.home.name}</span>
          </div>
          <div className="wc-scoreboard__center">
            {showScore ? (
              <div className="wc-scoreboard__score">{match.homeScore ?? 0} <span>–</span> {match.awayScore ?? 0}</div>
            ) : (
              <div className="wc-scoreboard__vs">v</div>
            )}
            <div className={`wc-scoreboard__status${live ? ' wc-scoreboard__status--live' : ''}`}>
              {statusLabel(match.status)}
            </div>
          </div>
          <div className="wc-scoreboard__team">
            <TeamCrest team={match.away} size={48} />
            <span className="wc-scoreboard__name">{match.away.name}</span>
          </div>
        </div>

        <div className="wc-modal__when">
          <span>🕑 {toBdTime(match.kickoffUtc)} (BD)</span>
          <WatchBadge info={watch} />
          {match.venue && <span className="wc-modal__venue">📍 {match.venue}</span>}
        </div>

        {/* Goal timeline */}
        {showScore && (
          <div className="wc-modal__section">
            <h4>Goals</h4>
            {detail?.status === 'loading' && <div className="wc-muted"><span className="refresh-spinner" /> Loading match events…</div>}
            {goals.length > 0 ? (
              <div className="wc-goals">
                <ul className="wc-goals__col">{homeGoals.map(goalLine)}</ul>
                <ul className="wc-goals__col wc-goals__col--away">{awayGoals.map(goalLine)}</ul>
              </div>
            ) : (
              detail?.status !== 'loading' && (
                <div className="wc-muted">
                  {!eventsEnabled
                    ? 'Add an API-Football key in Settings to see scorers & assists.'
                    : detail?.status === 'error'
                      ? `Could not load events (${detail.error}).`
                      : 'No goal events available.'}
                </div>
              )
            )}
          </div>
        )}

        {/* Man of the Match */}
        {finished && (
          <div className="wc-modal__section">
            <h4>Player of the Match</h4>
            {motm ? (
              <div className="wc-motm">
                <span className="wc-motm__icon">🏅</span>
                <span className="wc-motm__name">{motm.name}</span>
                {motm.rating != null && <span className="wc-motm__rating">{motm.rating.toFixed(1)}</span>}
                <span className="wc-motm__note">by rating</span>
              </div>
            ) : (
              <div className="wc-muted">
                {!eventsEnabled
                  ? 'Requires an API-Football key (derived from highest player rating).'
                  : detail?.status === 'loading' ? 'Calculating…' : 'Rating data unavailable for this match.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
