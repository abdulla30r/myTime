import { useState } from 'react';
import type { MatchResult } from '../types';
import { useWorldCup } from '../useWorldCup';
import { Fixtures } from './Fixtures';
import { Standings } from './Standings';
import { Knockout } from './Knockout';
import { MatchDetail } from './MatchDetail';
import { Settings } from './Settings';
import '../worldcup.css';

type Sub = 'fixtures' | 'standings' | 'knockout';

export function WorldCupTab() {
  const wc = useWorldCup();
  const [sub, setSub] = useState<Sub>('fixtures');
  const [openMatch, setOpenMatch] = useState<MatchResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const lastUpdated = wc.lastUpdated
    ? new Date(wc.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="wc">
      <header className="wc__head">
        <div className="wc__head-top">
          <h2 className="wc__title">⚽ FIFA World Cup 2026</h2>
          <div className="wc__actions">
            <span className={`wc__source wc__source--${wc.source}`}>
              {wc.source === 'live' ? '● LIVE DATA' : '○ BUNDLED'}
            </span>
            {wc.loading && <span className="refresh-spinner" />}
            <button className="wc-icon-btn" title="Refresh" onClick={wc.refresh} disabled={wc.loading}>⟳</button>
            <button className="wc-icon-btn" title="Data sources" onClick={() => setShowSettings(true)}>⚙</button>
          </div>
        </div>

        <nav className="wc-subtabs">
          {(['fixtures', 'standings', 'knockout'] as Sub[]).map((s) => (
            <button
              key={s}
              className={`wc-subtab${sub === s ? ' wc-subtab--active' : ''}`}
              onClick={() => setSub(s)}
            >
              {s === 'fixtures' ? '📅 Fixtures' : s === 'standings' ? '📊 Groups' : '🏆 Knockout'}
            </button>
          ))}
        </nav>

        {wc.source === 'bundled' && (
          <div className="wc-note">
            Showing the <b>built-in schedule</b> (real draw, provisional kickoff times).
            <button className="wc-link-btn" onClick={() => setShowSettings(true)}>Add a free token</button>
            for live, exact fixtures, scores &amp; standings.
          </div>
        )}
        {wc.error && <div className="wc-note wc-note--err">Live fetch failed: {wc.error}. Showing bundled data.</div>}
        {lastUpdated && <div className="wc-updated">Updated {lastUpdated}{wc.eventsEnabled ? ' · MOTM enabled' : ''}</div>}
      </header>

      <div className="wc__body">
        {sub === 'fixtures' && <Fixtures fixtures={wc.fixtures} onOpen={setOpenMatch} />}
        {sub === 'standings' && <Standings tables={wc.standings} />}
        {sub === 'knockout' && <Knockout bracket={wc.bracket} />}
      </div>

      {openMatch && (
        <MatchDetail
          match={openMatch}
          detail={wc.details[openMatch.id]}
          eventsEnabled={wc.eventsEnabled}
          onLoad={wc.loadDetail}
          onClose={() => setOpenMatch(null)}
        />
      )}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onSaved={wc.refresh} />
      )}
    </section>
  );
}
