import { useState } from 'react';
import { useTimeDoctor } from '../hooks/useTimeDoctor';

interface TDPanelProps {
  onApply: (hours: number, minutes: number) => void;
}

export function TDPanel({ onApply }: TDPanelProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    status,
    message,
    timeWorked,
    fetchTimeDoctor,
    hasSavedCredentials,
  } = useTimeDoctor();

  const [showLogin, setShowLogin] = useState(!hasSavedCredentials);

  const handleFetch = () => {
    fetchTimeDoctor(onApply);
  };

  return (
    <div className="td-panel">
      {/* Login form — only shown if no saved credentials or user wants to change */}
      {showLogin && (
        <div className="td-login">
          <input
            className="td-input"
            type="email"
            placeholder="TD Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
          <input
            className="td-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          />
        </div>
      )}

      <button
        className="td-fetch-btn"
        onClick={handleFetch}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <span className="td-spinner" />
            Fetching...
          </>
        ) : (
          '🖥 Fetch from Time Doctor'
        )}
      </button>

      {message && (
        <div className={`td-status td-status--${status}`}>
          {message}
        </div>
      )}

      {timeWorked && status === 'success' && (
        <div className="td-result">
          ✅ Applied: <strong>{timeWorked}</strong>
        </div>
      )}

      {hasSavedCredentials && !showLogin && (
        <button
          className="td-change-btn"
          onClick={() => setShowLogin(true)}
        >
          ↻ Change Account
        </button>
      )}
    </div>
  );
}
