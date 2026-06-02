import { useState } from 'react';
import { LS } from '../api';

export function Settings({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fdToken, setFdToken] = useState(localStorage.getItem(LS.fdToken) ?? '');
  const [apiKey, setApiKey] = useState(localStorage.getItem(LS.apiFootballKey) ?? '');
  const [fdEnv, setFdEnv] = useState(localStorage.getItem(LS.fdEnv) === '1');

  const save = () => {
    const setOrClear = (key: string, val: string) => {
      if (val.trim()) localStorage.setItem(key, val.trim());
      else localStorage.removeItem(key);
    };
    setOrClear(LS.fdToken, fdToken);
    setOrClear(LS.apiFootballKey, apiKey);
    if (fdEnv) localStorage.setItem(LS.fdEnv, '1'); else localStorage.removeItem(LS.fdEnv);
    onSaved();
    onClose();
  };

  return (
    <div className="wc-modal" onClick={onClose}>
      <div className="wc-modal__card wc-settings" onClick={(e) => e.stopPropagation()}>
        <button className="wc-modal__close" onClick={onClose}>✕</button>
        <h3 className="wc-settings__title">⚽ World Cup data sources</h3>
        <p className="wc-muted">
          Tokens are sent only to this app's own proxy and never bundled into the page.
          Leave blank to use the built-in fixtures.
        </p>

        <label className="wc-field">
          <span>football-data.org token <em>(fixtures · scores · standings · bracket)</em></span>
          <input
            className="wc-input"
            type="password"
            value={fdToken}
            placeholder="X-Auth-Token from football-data.org"
            onChange={(e) => setFdToken(e.target.value)}
          />
          <a className="wc-link" href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer">
            Get a free token →
          </a>
        </label>

        <label className="wc-field wc-field--check">
          <input type="checkbox" checked={fdEnv} onChange={(e) => setFdEnv(e.target.checked)} />
          <span>Token is configured on the server (FD_TOKEN env) — fetch live without pasting it here</span>
        </label>

        <label className="wc-field">
          <span>API-Football key <em>(goal scorers · assists · Man of the Match)</em></span>
          <input
            className="wc-input"
            type="password"
            value={apiKey}
            placeholder="x-apisports-key from API-SPORTS"
            onChange={(e) => setApiKey(e.target.value)}
          />
          <a className="wc-link" href="https://www.api-football.com/" target="_blank" rel="noreferrer">
            Get a free key (100/day) →
          </a>
        </label>

        <div className="wc-settings__actions">
          <button className="wc-btn wc-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="wc-btn wc-btn--primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
