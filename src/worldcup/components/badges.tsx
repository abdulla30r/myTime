import type { Team } from '../types';
import type { WatchInfo } from '../time';
import { statusLabel, isLive, isFinished } from '../time';
import type { MatchStatus } from '../types';

// ── Team crest: real image when the live feed provides one, else a FIFA-code monogram ──
export function TeamCrest({ team, size = 28 }: { team?: Team; size?: number }) {
  const code = team?.fifa && team.fifa !== '?' ? team.fifa : 'TBD';
  if (team?.crestUrl) {
    return (
      <img
        className="wc-crest wc-crest--img"
        src={team.crestUrl}
        alt={team.name}
        width={size}
        height={size}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className="wc-crest wc-crest--mono"
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.33) }}
      title={team?.name}
    >
      {code}
    </span>
  );
}

export function StatusBadge({ status, minute }: { status: MatchStatus; minute?: number }) {
  const live = isLive(status);
  const ft = isFinished(status);
  const cls = live ? 'wc-status--live' : ft ? 'wc-status--ft' : 'wc-status--scheduled';
  return (
    <span className={`wc-status ${cls}`}>
      {live && <span className="wc-status__dot" />}
      {statusLabel(status, minute)}
    </span>
  );
}

export function WatchBadge({ info }: { info: WatchInfo }) {
  return (
    <span className={`wc-watch wc-watch--${info.where}`} title={info.label}>
      <span className="wc-watch__icon">{info.icon}</span>
      <span className="wc-watch__label">{info.where === 'office' ? 'Office' : 'Home'}</span>
    </span>
  );
}
