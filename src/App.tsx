import { useRef, useState, useCallback, useEffect } from 'react';
import './App.css';
import { useTimeCalculator } from './hooks/useTimeCalculator';
import { useTheme } from './hooks/useTheme';
import { quotes } from './assets/data';
import { ResultCard } from './components/ResultCard';
import { ProgressBar } from './components/ProgressBar';
import { FetchPanel } from './components/FetchPanel';
import type { FetchPanelHandle } from './components/FetchPanel';
import type { ScheduleMode } from './types/time';

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
  const hasTdData = useRef(true); // false when employee has no TD mapping
  const {
    started,
    setStarted,
    mode,
    setMode,
    entryHour,
    entryMinute,
    setEntryHour,
    setEntryMinute,
    entryTime,
    tdHours,
    setTdHours,
    tdMinutes,
    setTdMinutes,
    result,
    clock,
    entryElapsedStr,
    tdTrackedStr,
    tdRemainingCountdown,
    effectiveStayRemainingCountdown,
    extraTimeCountdown,
    freeTimeCountdown,
  } = useTimeCalculator();

  const handleApply = useCallback((entry: { hour: number; minute: number }, td: { hours: number; minutes: number } | null) => {
    setEntryHour(entry.hour);
    setEntryMinute(entry.minute);
    if (td) {
      setTdHours(td.hours);
      setTdMinutes(td.minutes);
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

  return (
    <div className="app">
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
          {(['regular', 'ramadan'] as ScheduleMode[]).map((m) => (
            <button
              key={m}
              className={`tab-bar__tab${mode === m ? ' tab-bar__tab--active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'regular' ? '📅 Regular' : '🌙 Ramadan'}
            </button>
          ))}
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
      <div style={started ? { position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' } : undefined}>
        <FetchPanel
          ref={fetchPanelRef}
          onLoadingChange={setRefreshing}
          onMessages={handleRefreshMessage}
          onApply={handleApply}
        />
      </div>

      {!started ? (
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
                {entryHour.toString().padStart(2, '0')}:{entryMinute.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Time Doctor */}
            <div className="setup-card">
              <div className="setup-card__header">
                <span className="setup-card__icon">🖥</span>
                <span className="setup-card__label">Time Doctor</span>
              </div>
              <div className="setup-card__value">
                {hasTdData.current
                  ? `${tdHours.toString().padStart(2, '0')}:${tdMinutes.toString().padStart(2, '0')}`
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

            {/* Time Doctor Card */}
            <div className="input-card">
              <div className="input-card__header">
                <span className="input-card__icon">🖥</span>
                <span className="input-card__label">Time Doctor</span>
              </div>
              <div className="input-card__display">
                {hasTdData.current ? (
                  <>
                    <span className="input-card__time">{tdTrackedStr}</span>
                    <span className="input-card__countdown">⏳ {tdRemainingCountdown} left</span>
                    <span className="input-card__sub">set: {tdHours}h {tdMinutes}m</span>
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
                  label="Time Doctor Remaining"
                  value="No need to work more ✔"
                >
                  <span className="result-card__sub" style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {tdRemainingCountdown}
                  </span>
                </ResultCard>
              ) : (
                <ResultCard
                  icon="🖥"
                  label="Time Doctor Remaining"
                  value={tdRemainingCountdown}
                  highlight={result.drivingConstraint === 'timeDoctor'}
                  countdown
                />
              )
            ) : (
              <ResultCard icon="🖥" label="Time Doctor Remaining" value="N/A">
                <span className="result-card__sub">No Time Doctor for this employee</span>
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
                <span className="result-card__sub">No Time Doctor for this employee</span>
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
                <span className="result-card__sub">No Time Doctor for this employee</span>
              </ResultCard>
            )}
          </section>
        </>
      )}

      {/* ── Motivational Quote ── */}
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
    </div>
  );
}

export default App;
