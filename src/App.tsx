import { useRef } from 'react';
import './App.css';
import { useTimeCalculator } from './hooks/useTimeCalculator';
import { useTheme } from './hooks/useTheme';
import { ResultCard } from './components/ResultCard';
import { ProgressBar } from './components/ProgressBar';
import { FetchPanel } from './components/FetchPanel';
import type { ScheduleMode } from './types/time';

function App() {
  const { theme, toggleTheme } = useTheme();
  const hasTdData = useRef(true); // false when employee has no TD mapping
  const {
    started,
    setStarted,
    mode,
    setMode,
    config,
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
    stayRemainingCountdown,
    extraTimeCountdown,
    freeTimeCountdown,
  } = useTimeCalculator();

  return (
    <div className="app">
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
        <button className="btn-theme" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="title-row">
        <h1 className="app__title">
          {(() => {
            const name = localStorage.getItem('myTime_ramsEmployee');
            return name ? `👋 Hello, ${name}` : '⏱ myTime';
          })()}
        </h1>
        <div className="live-clock">{clock}</div>
      </div>
      <p className="app__subtitle">
        {config.workHours}h work · {config.stayHours}h stay — TRACK WHAT'S LEFT
      </p>

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

          {/* Single fetch panel */}
          <FetchPanel
            onApply={(entry, td) => {
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
            }}
          />
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
              <ResultCard
                icon="🖥"
                label="Time Doctor Remaining"
                value={tdRemainingCountdown}
                highlight={result.drivingConstraint === 'timeDoctor'}
                countdown
              >
                {result.tdTrackedSeconds >= result.progressPercent && result.progressPercent >= 100 && (
                  <span className="result-card__sub">Quota complete ✔</span>
                )}
              </ResultCard>
            ) : (
              <ResultCard icon="🖥" label="Time Doctor Remaining" value="N/A">
                <span className="result-card__sub">No Time Doctor for this employee</span>
              </ResultCard>
            )}

            <ResultCard
              icon="🏢"
              label="Office Stay Remaining"
              value={stayRemainingCountdown}
              highlight={result.drivingConstraint === 'entry'}
              countdown
            >
              <span className="result-card__sub">Leave at {result.canLeaveAt}</span>
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

          {/* ── Motivational Quote ── */}
          <div className="quote-card">
            <span className="quote-card__icon">⚔️</span>
            <p className="quote-card__text">হয় ভালোভাবে চাকরি করুন</p>
            <p className="quote-card__text">নইলে চাকরিটা ছেড়ে দিন</p>
          </div>

          <button className="btn-reset" onClick={() => setStarted(false)}>
            ✎ EDIT INPUTS
          </button>
        </>
      )}
    </div>
  );
}

export default App;
