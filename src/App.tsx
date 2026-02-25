import { useState, useRef } from 'react';
import './App.css';
import { useTimeCalculator } from './hooks/useTimeCalculator';
import { useTheme } from './hooks/useTheme';
import { ResultCard } from './components/ResultCard';
import { ProgressBar } from './components/ProgressBar';
import { RAMSPanel } from './components/RAMSPanel';
import { TDPanel } from './components/TDPanel';
import type { ScheduleMode } from './types/time';

function App() {
  const { theme, toggleTheme } = useTheme();
  const ramsFetched = useRef(false);
  const tdFetched = useRef(false);
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
        <h1 className="app__title">⏱ myTime</h1>
        <div className="live-clock">{clock}</div>
      </div>
      <p className="app__subtitle">
        {config.workHours}h work · {config.stayHours}h stay — TRACK WHAT'S LEFT
      </p>

      {!started ? (
        /* ── Setup Screen ── */
        <section className="setup-screen">
          <div className="setup-row">
            {/* Entry Time — from RAMS */}
            <div className="setup-card">
              <div className="setup-card__header">
                <span className="setup-card__icon">🚪</span>
                <span className="setup-card__label">Entry Time</span>
              </div>
              <div className="setup-card__value">
                {entryHour.toString().padStart(2, '0')}:{entryMinute.toString().padStart(2, '0')}
              </div>
              <RAMSPanel
                onApply={(h, m) => {
                  setEntryHour(h);
                  setEntryMinute(m);
                  ramsFetched.current = true;
                  if (tdFetched.current) setStarted(true);
                }}
              />
            </div>

            {/* Time Doctor — from TD API */}
            <div className="setup-card">
              <div className="setup-card__header">
                <span className="setup-card__icon">🖥</span>
                <span className="setup-card__label">Time Doctor</span>
              </div>
              <div className="setup-card__value">
                {tdHours.toString().padStart(2, '0')}:{tdMinutes.toString().padStart(2, '0')}
              </div>
              <TDPanel
                onApply={(h, m) => {
                  setTdHours(h);
                  setTdMinutes(m);
                  tdFetched.current = true;
                  if (ramsFetched.current) setStarted(true);
                }}
              />
            </div>
          </div>

          <button className="btn-start" onClick={() => setStarted(true)}>
            ▶ START
          </button>
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
                <span className="input-card__time">{tdTrackedStr}</span>
                <span className="input-card__countdown">⏳ {tdRemainingCountdown} left</span>
                <span className="input-card__sub">set: {tdHours}h {tdMinutes}m</span>
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

            <ResultCard
              icon="🏢"
              label="Office Stay Remaining"
              value={stayRemainingCountdown}
              highlight={result.drivingConstraint === 'entry'}
              countdown
            >
              <span className="result-card__sub">Leave at {result.canLeaveAt}</span>
            </ResultCard>

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
          </section>

          <button className="btn-reset" onClick={() => setStarted(false)}>
            ✎ EDIT INPUTS
          </button>
        </>
      )}
    </div>
  );
}

export default App;
