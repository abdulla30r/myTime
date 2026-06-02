import { useRef, useState, useCallback, useEffect } from 'react';
import './App.css';
import { useTimeCalculator } from './hooks/useTimeCalculator';
import { useTheme } from './hooks/useTheme';
import { quotes, breakingNews } from './assets/data';
import { ResultCard } from './components/ResultCard';
import { ProgressBar } from './components/ProgressBar';
import { FetchPanel } from './components/FetchPanel';
import { ActivityStats } from './components/ActivityStats';
import { BreakingNewsTicker } from './components/BreakingNewsTicker';
import { Leaderboard } from './components/Leaderboard';
import { WorldCupTab } from './worldcup/components/WorldCupTab';
import type { FetchPanelHandle, FirstArrivalState, LeaderboardData } from './components/FetchPanel';
import type { ScheduleMode } from './types/time';

type View = 'home' | 'leaderboard' | 'worldcup';

function App() {
  const { theme, toggleTheme } = useTheme();
  const fetchPanelRef = useRef<FetchPanelHandle>(null);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [quoteReset, setQuoteReset] = useState(0);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const id = setInterval(() => {
      setQuoteIndex((prev) => {
        let next;
        do { next = Math.floor(Math.random() * quotes.length); } while (next === prev);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [quoteReset]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessages, setRefreshMessages] = useState<string[]>([]);
  const [view, setView] = useState<View>('home');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [arrivalState, setArrivalState] = useState<FirstArrivalState | null>({
    status: 'loading',
    first: null,
  });
  const hasTdData = useRef(true); // false when employee has no TD mapping
  const {
    started,
    setStarted,
    mode,
    setMode,
    entryHour,
    entryMinute,
    entrySecond,
    setEntryTime,
    entryTime,
    tdHours,
    setTdHours,
    tdMinutes,
    setTdMinutes,
    tdSeconds,
    setTdSeconds,
    result,
    clock,
    entryElapsedStr,
    tdTrackedStr,
    tdRemainingCountdown,
    effectiveStayRemainingCountdown,
    extraTimeCountdown,
    freeTimeCountdown,
  } = useTimeCalculator();

  const handleApply = useCallback((entry: { hour: number; minute: number; second: number }, td: { hours: number; minutes: number; seconds: number } | null) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    setEntryTime(`${pad(entry.hour)}:${pad(entry.minute)}:${pad(entry.second)}`);
    if (td) {
      setTdHours(td.hours);
      setTdMinutes(td.minutes);
      setTdSeconds(td.seconds);
      hasTdData.current = true;
    } else {
      hasTdData.current = false;
    }
    setStarted(true);
    setRefreshing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshMessages([]);
    fetchPanelRef.current?.refresh();
  }, []);

  const handleRefreshMessage = useCallback((msgs: string[]) => {
    setRefreshMessages(msgs);
  }, []);

  const savedEmployeeName = (() => {
    try {
      const raw = localStorage.getItem('myTime_ramsEmployee');
      return raw ? raw.replace(/\s*\(.*\)/, '') : '';
    } catch { return ''; }
  })();
  const firstArrival = arrivalState?.status === 'found' ? arrivalState.first : null;
  const isYouFirst =
    firstArrival !== null &&
    savedEmployeeName !== '' &&
    firstArrival.name.replace(/\s*\(.*\)/, '') === savedEmployeeName;

  return (
    <div className="app">
      {/* ── Breaking News Ticker ── */}
      <BreakingNewsTicker items={breakingNews} />

      {/* ── First Arrival Banner ── */}
      {arrivalState?.status === 'loading' && (
        <div className="first-arrival-banner first-arrival-banner--loading">
          <span className="refresh-spinner" />
          <span className="first-arrival-banner__label">Checking attendance...</span>
        </div>
      )}
      {arrivalState?.status === 'empty' && (
        <div className="first-arrival-banner first-arrival-banner--empty">
          <span className="first-arrival-banner__icon">🪑</span>
          <span className="first-arrival-banner__label">No one is here yet</span>
        </div>
      )}
      {arrivalState?.status === 'found' && firstArrival && (
        <div className={`first-arrival-banner${isYouFirst ? ' first-arrival-banner--you' : ''}`}>
          <span className="first-arrival-banner__icon">🏆</span>
          <span className="first-arrival-banner__label">
            {isYouFirst ? 'You were first in today' : 'First in today'}
          </span>
          <span className="first-arrival-banner__name">
            {firstArrival.name.replace(/\s*\(.*\)/, '')}
          </span>
          <span className="first-arrival-banner__time">@ {firstArrival.firstIn}</span>
        </div>
      )}

      {/* ── Refresh Overlay ── */}
      {refreshing && started && (
        <div className="refresh-overlay">
          <div className="refresh-overlay__card">
            <span className="refresh-spinner refresh-spinner--lg" />
            <h2 className="refresh-overlay__title">Refreshing Data</h2>
            {refreshMessages.map((msg, i) => (
              <div key={i} className={`refresh-overlay__msg`}>{msg}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Row: Tab Bar + Theme Toggle ── */}
      <div className="top-row">
        <nav className="tab-bar">
          {(['regular', 'ramadan'] as ScheduleMode[]).map((m) => {
            const active = view === 'home' && mode === m;
            return (
              <button
                key={m}
                className={`tab-bar__tab${active ? ' tab-bar__tab--active' : ''}`}
                onClick={() => { setMode(m); setView('home'); }}
              >
                {m === 'regular' ? '📅 Regular' : '🌙 Ramadan'}
              </button>
            );
          })}
          <button
            className={`tab-bar__tab${view === 'leaderboard' ? ' tab-bar__tab--active' : ''}`}
            onClick={() => setView('leaderboard')}
          >
            🏆 Leaderboard
          </button>
          <button
            className={`tab-bar__tab${view === 'worldcup' ? ' tab-bar__tab--active' : ''}`}
            onClick={() => setView('worldcup')}
          >
            ⚽ World Cup
          </button>
        </nav>
        {started && (
          <button
            className={`btn-refresh${refreshing ? ' btn-refresh--spin' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh data"
          >
            {refreshing ? <span className="refresh-spinner" /> : '⚡'}
          </button>
        )}
        <button className="btn-theme" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="title-row">
        <h1 className="app__title">
          {(() => {
            const name = localStorage.getItem('myTime_ramsEmployee');
            if (!name) return '⏱ myTime';
            const clean = name.replace(/\s*\(.*\)/, '');
            return clean;
          })()}
        </h1>
        <div className="live-clock">{clock}</div>
        {started && (
          <button className="btn-reset" onClick={() => setStarted(false)}>
            ✎ EDIT INPUTS
          </button>
        )}
      </div>

      {/* FetchPanel always mounted so refresh ref works from countdown screen */}
      <div style={started || view !== 'home' ? { position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' } : undefined}>
        <FetchPanel
          ref={fetchPanelRef}
          onLoadingChange={setRefreshing}
          onMessages={handleRefreshMessage}
          onApply={handleApply}
          onFirstArrival={setArrivalState}
          onLeaderboardData={setLeaderboardData}
        />
      </div>

      {view === 'worldcup' ? (
        <WorldCupTab />
      ) : view === 'leaderboard' ? (
        <Leaderboard data={leaderboardData} currentEmployee={savedEmployeeName} />
      ) : !started ? (
        /* ── Setup Screen ── */
        <section className="setup-screen">
          <div className="setup-row">
            {/* Entry Time */}
            <div className="setup-card">
              <div className="setup-card__header">
                <span className="setup-card__icon">🚪</span>
                <span className="setup-card__label">Entry Time</span>
              </div>
              <div className="setup-card__value">
                {entryHour.toString().padStart(2, '0')}:{entryMinute.toString().padStart(2, '0')}:{entrySecond.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Mr Time */}
            <div className="setup-card">
              <div className="setup-card__header">
                <span className="setup-card__icon">🖥</span>
                <span className="setup-card__label">Mr Time</span>
              </div>
              <div className="setup-card__value">
                {hasTdData.current
                  ? `${tdHours.toString().padStart(2, '0')}:${tdMinutes.toString().padStart(2, '0')}:${tdSeconds.toString().padStart(2, '0')}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ── Countdown Screen ── */
        <>
          {/* ── Input Cards ── */}
          <section className="input-cards">
            {/* Entry Time Card */}
            <div className="input-card">
              <div className="input-card__header">
                <span className="input-card__icon">🚪</span>
                <span className="input-card__label">Entry Time</span>
              </div>
              <div className="input-card__display">
                <span className="input-card__time">{entryElapsedStr}</span>
                <span className="input-card__sub">since {entryTime}</span>
              </div>
            </div>

            {/* Mr Time Card */}
            <div className="input-card">
              <div className="input-card__header">
                <span className="input-card__icon">🖥</span>
                <span className="input-card__label">Mr Time</span>
              </div>
              <div className="input-card__display">
                {hasTdData.current ? (
                  <>
                    <span className="input-card__time">{tdTrackedStr}</span>
                    <span className="input-card__countdown">⏳ {tdRemainingCountdown} left</span>
                    <span className="input-card__sub">set: {tdHours}h {tdMinutes}m {tdSeconds}s</span>
                  </>
                ) : (
                  <span className="input-card__time input-card__na">N/A</span>
                )}
              </div>
            </div>
          </section>

          {/* ── Progress ── */}
          <section className="progress-section">
            <h2>📊 Work Progress</h2>
            <ProgressBar percent={result.progressPercent} />
          </section>

          {/* ── Countdown Results ── */}
          <section className="results-section">
            {hasTdData.current ? (
              result.progressPercent >= 100 ? (
                <ResultCard
                  icon="🖥"
                  label="Mr Time Remaining"
                  value="No need to work more ✔"
                >
                  <span className="result-card__sub" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {tdRemainingCountdown}
                  </span>
                </ResultCard>
              ) : (
                <ResultCard
                  icon="🖥"
                  label="Mr Time Remaining"
                  value={tdRemainingCountdown}
                  highlight={result.drivingConstraint === 'timeDoctor'}
                  countdown
                />
              )
            ) : (
              <ResultCard icon="🖥" label="Mr Time Remaining" value="N/A">
                <span className="result-card__sub">No Mr Time for this employee</span>
              </ResultCard>
            )}

            <ResultCard
              icon="🏢"
              label="Office Stay Remaining"
              value={effectiveStayRemainingCountdown}
              highlight={result.drivingConstraint === 'entry'}
              countdown
            >
              <span className="result-card__sub">Leave at {result.effectiveCanLeaveAt}</span>
              {extraTimeCountdown !== '0:00:00' && (
                <span className="result-card__sub">+{extraTimeCountdown} extra (TD)</span>
              )}
            </ResultCard>

            {hasTdData.current ? (
              <ResultCard
                icon="⏰"
                label="Extra Time Required"
                value={extraTimeCountdown === '0:00:00' ? 'CLEAR' : extraTimeCountdown}
                highlight={extraTimeCountdown !== '0:00:00'}
                countdown={extraTimeCountdown !== '0:00:00'}
              >
                <span className="result-card__sub">
                  {extraTimeCountdown !== '0:00:00' ? 'TD exceeds office stay' : 'No extra time needed ✔'}
                </span>
              </ResultCard>
            ) : (
              <ResultCard icon="⏰" label="Extra Time Required" value="N/A">
                <span className="result-card__sub">No Mr Time for this employee</span>
              </ResultCard>
            )}

            {hasTdData.current ? (
              <ResultCard
                icon="☕"
                label="Available Free Time"
                value={freeTimeCountdown === '0:00:00' ? 'NONE' : freeTimeCountdown}
                countdown={freeTimeCountdown !== '0:00:00'}
              >
                <span className="result-card__sub">
                  {freeTimeCountdown === '0:00:00' ? 'No buffer remaining' : 'Break / buffer time'}
                </span>
              </ResultCard>
            ) : (
              <ResultCard icon="☕" label="Available Free Time" value="N/A">
                <span className="result-card__sub">No Mr Time for this employee</span>
              </ResultCard>
            )}
          </section>
        </>
      )}

          {/* ── Activity Stats ── */}
          {view === 'home' && hasTdData.current && <ActivityStats />}

      {/* ── Motivational Quote ── */}
      {view === 'home' && (
      <div className="quote-card">
        <div className="quote-card__top">
          <h3 className="quote-card__header">বাণী অমৃত</h3>
          <button
            className="quote-card__refresh"
            onClick={() => {
              setQuoteIndex((prev) => {
                let next;
                do { next = Math.floor(Math.random() * quotes.length); } while (next === prev && quotes.length > 1);
                return next;
              });
              setQuoteReset((c) => c + 1);
            }}
            title="Next quote"
          >
            ↻
          </button>
        </div>
        <span className="quote-card__icon">{quotes[quoteIndex].icon}</span>
        {quotes[quoteIndex].lines.map((line, i) => (
          <p key={i} className="quote-card__text">{line}</p>
        ))}
      </div>
      )}
    </div>
  );
}

export default App;
