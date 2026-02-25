import { useState, useEffect, useRef } from 'react';
import './App.css';
import { useTimeCalculator } from './hooks/useTimeCalculator';
import { useTheme } from './hooks/useTheme';
import { ResultCard } from './components/ResultCard';
import { ProgressBar } from './components/ProgressBar';
import { TimePicker } from './components/TimePicker';
import type { ScheduleMode } from './types/time';

/** Input that lets users clear the field and type freely; commits on blur/Enter */
function SetupInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(value.toString().padStart(2, '0'));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from parent when value changes externally (e.g. via picker)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setText(value.toString().padStart(2, '0'));
    }
  }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (!isNaN(n)) {
      const clamped = Math.max(min, Math.min(max, n));
      onChange(clamped);
      setText(clamped.toString().padStart(2, '0'));
    } else {
      setText(value.toString().padStart(2, '0'));
    }
  };

  return (
    <div className="setup-field">
      <label className="setup-field__label">{label}</label>
      <input
        ref={inputRef}
        className="setup-field__input"
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={text}
        onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [setupEntryPicker, setSetupEntryPicker] = useState(false);
  const [setupTdPicker, setSetupTdPicker] = useState(false);
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
    editingEntry,
    setEditingEntry,
    editingTd,
    setEditingTd,
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

      <h1 className="app__title">⏱ myTime</h1>
      <div className="live-clock">{clock}</div>
      <p className="app__subtitle">
        {config.workHours}h work · {config.stayHours}h stay — TRACK WHAT'S LEFT
      </p>

      {!started ? (
        /* ── Setup Screen ── */
        <section className="setup-screen">
          <div className="setup-card">
            <div className="setup-card__header">
              <span className="setup-card__icon">🚪</span>
              <span className="setup-card__label">Entry Time</span>
              <button className="btn-modify" onClick={() => setSetupEntryPicker(true)}>⚙ PICK</button>
            </div>
            <div className="setup-card__inputs">
              <SetupInput label="HR" value={entryHour} min={0} max={23} onChange={setEntryHour} />
              <span className="setup-sep">:</span>
              <SetupInput label="MIN" value={entryMinute} min={0} max={59} onChange={setEntryMinute} />
            </div>
            {setupEntryPicker && (
              <TimePicker
                hour={entryHour}
                minute={entryMinute}
                onHourChange={setEntryHour}
                onMinuteChange={setEntryMinute}
                onClose={() => setSetupEntryPicker(false)}
              />
            )}
          </div>

          <div className="setup-card">
            <div className="setup-card__header">
              <span className="setup-card__icon">🖥</span>
              <span className="setup-card__label">Time Doctor Tracked</span>
              <button className="btn-modify" onClick={() => setSetupTdPicker(true)}>⚙ PICK</button>
            </div>
            <div className="setup-card__inputs">
              <SetupInput label="HR" value={tdHours} min={0} max={config.workHours} onChange={setTdHours} />
              <span className="setup-sep">:</span>
              <SetupInput label="MIN" value={tdMinutes} min={0} max={59} onChange={setTdMinutes} />
            </div>
            {setupTdPicker && (
              <TimePicker
                hour={tdHours}
                minute={tdMinutes}
                onHourChange={(h) => setTdHours(Math.min(h, config.workHours))}
                onMinuteChange={setTdMinutes}
                onClose={() => setSetupTdPicker(false)}
              />
            )}
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
                <button
                  className="btn-modify"
                  onClick={() => setEditingEntry(true)}
                >
                  ⚙ SET
                </button>
              </div>
              <div className="input-card__display">
                <span className="input-card__time">{entryElapsedStr}</span>
                <span className="input-card__sub">since {entryTime}</span>
              </div>
              {editingEntry && (
                <TimePicker
                  hour={entryHour}
                  minute={entryMinute}
                  onHourChange={setEntryHour}
                  onMinuteChange={setEntryMinute}
                  onClose={() => setEditingEntry(false)}
                />
              )}
            </div>

            {/* Time Doctor Card */}
            <div className="input-card">
              <div className="input-card__header">
                <span className="input-card__icon">🖥</span>
                <span className="input-card__label">Time Doctor</span>
                <button
                  className="btn-modify"
                  onClick={() => setEditingTd(true)}
                >
                  ⚙ SET
                </button>
              </div>
              <div className="input-card__display">
                <span className="input-card__time">{tdTrackedStr}</span>
                <span className="input-card__countdown">⏳ {tdRemainingCountdown} left</span>
                <span className="input-card__sub">set: {tdHours}h {tdMinutes}m</span>
              </div>
              {editingTd && (
                <TimePicker
                  hour={tdHours}
                  minute={tdMinutes}
                  onHourChange={(h) => setTdHours(Math.min(h, config.workHours))}
                  onMinuteChange={setTdMinutes}
                  onClose={() => setEditingTd(false)}
                />
              )}
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
