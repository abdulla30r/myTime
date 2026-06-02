import { useState } from 'react';
import type { Bracket, BracketTeamSlot, KnockoutTie } from '../types';
import { bdDayLabel, bdTimeOnly, isFinished } from '../time';
import { TeamCrest, StatusBadge } from './badges';

function TeamSlot({ slot }: { slot: BracketTeamSlot }) {
  return (
    <div className={`wc-slot${slot.isEliminated ? ' wc-slot--out' : ''}`}>
      <TeamCrest team={slot.team} size={18} />
      <span className="wc-slot__name">{slot.team?.name ?? 'TBD'}</span>
      {slot.score != null && <span className="wc-slot__score">{slot.score}</span>}
    </div>
  );
}

function TieBox({ tie }: { tie: KnockoutTie }) {
  return (
    <div className="wc-tie">
      <TeamSlot slot={tie.home} />
      <TeamSlot slot={tie.away} />
      {!isFinished(tie.status) && (
        <div className="wc-tie__when">{bdTimeOnly(tie.kickoffUtc)} · {bdDayLabel(tie.kickoffUtc)}</div>
      )}
    </div>
  );
}

// ── List view ──
const SECTIONS: { key: keyof Bracket | 'thirdPlace' | 'final'; title: string }[] = [
  { key: 'round32', title: 'Round of 32' },
  { key: 'round16', title: 'Round of 16' },
  { key: 'quarters', title: 'Quarter-finals' },
  { key: 'semis', title: 'Semi-finals' },
  { key: 'thirdPlace', title: 'Third-place play-off' },
  { key: 'final', title: 'Final' },
];

function KnockoutList({ bracket }: { bracket: Bracket }) {
  return (
    <div className="wc-ko-list">
      {SECTIONS.map(({ key, title }) => {
        const val = bracket[key];
        const ties: KnockoutTie[] = Array.isArray(val) ? val : val ? [val] : [];
        if (ties.length === 0) return null;
        return (
          <section key={key} className="wc-ko-section">
            <h3 className="wc-ko-section__title">{title}</h3>
            <div className="wc-ko-section__rows">
              {ties.map((t) => (
                <div key={t.id} className="wc-ko-row">
                  <div className="wc-ko-row__teams">
                    <TeamSlot slot={t.home} />
                    <TeamSlot slot={t.away} />
                  </div>
                  <div className="wc-ko-row__meta">
                    <StatusBadge status={t.status} />
                    <span className="wc-ko-row__when">{bdTimeOnly(t.kickoffUtc)} · {bdDayLabel(t.kickoffUtc)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Bracket graph (custom, columns left→right) ──
function Round({ title, ties }: { title: string; ties: KnockoutTie[] }) {
  if (ties.length === 0) return null;
  return (
    <div className="wc-bracket__round">
      <div className="wc-bracket__round-title">{title}</div>
      <div className="wc-bracket__ties">
        {ties.map((t) => <TieBox key={t.id} tie={t} />)}
      </div>
    </div>
  );
}

function BracketGraph({ bracket }: { bracket: Bracket }) {
  return (
    <div className="wc-bracket-wrap">
      <div className="wc-bracket">
        <Round title="R32" ties={bracket.round32} />
        <Round title="R16" ties={bracket.round16} />
        <Round title="QF" ties={bracket.quarters} />
        <Round title="SF" ties={bracket.semis} />
        <Round title="Final" ties={bracket.final ? [bracket.final] : []} />
      </div>
      {bracket.thirdPlace && (
        <div className="wc-bracket__third">
          <div className="wc-bracket__round-title">Third place</div>
          <TieBox tie={bracket.thirdPlace} />
        </div>
      )}
    </div>
  );
}

export function Knockout({ bracket }: { bracket: Bracket }) {
  const [view, setView] = useState<'bracket' | 'list'>('bracket');
  return (
    <div className="wc-knockout">
      <div className="wc-pills wc-pills--right">
        <button className={`wc-pill${view === 'bracket' ? ' wc-pill--active' : ''}`} onClick={() => setView('bracket')}>🗂 Bracket</button>
        <button className={`wc-pill${view === 'list' ? ' wc-pill--active' : ''}`} onClick={() => setView('list')}>☰ List</button>
      </div>
      {view === 'bracket' ? <BracketGraph bracket={bracket} /> : <KnockoutList bracket={bracket} />}
    </div>
  );
}
