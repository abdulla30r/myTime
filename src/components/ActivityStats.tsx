import { useState } from 'react';
import {
  useActivityStats,
  getStatColorClass,
  secsToHMS,
} from '../hooks/useActivityStats';

export function ActivityStats() {
  const { status, error, stats, fetchStats, reset } = useActivityStats();
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      reset();
      return;
    }

    const userId = localStorage.getItem('myTime_tdSelectedUserId');
    if (!userId) {
      setOpen(true);
      return;
    }

    setOpen(true);
    fetchStats(userId);
  };

  const handleRefresh = () => {
    const userId = localStorage.getItem('myTime_tdSelectedUserId');
    if (userId) fetchStats(userId);
  };

  const userId = localStorage.getItem('myTime_tdSelectedUserId');

  // Extracted values
  const totalSec = stats?.totalSec ?? 0;
  const activeSec = stats?.activeSec ?? 0;
  const idleSec = stats?.idleSec ?? 0;
  const unprodSec = stats?.unprod ?? 0;
  const mobileSec = stats?.mobile ?? 0;
  const manualSec = stats?.manual ?? 0;
  const meetingSec = stats?.meeting ?? 0;
  const paidBreakSec = stats?.paidBreak ?? 0;

  const activeRatio = stats?.standardActiveSecRatio ?? stats?.activeSecRatio ?? 0;
  const idleRatio = stats?.idleMinsRatio ?? stats?.idleSecRatio ?? 0;
  const unprodRatio = stats?.unprodRatio ?? 0;
  const mobileRatio = stats?.mobileRatio ?? 0;
  const manualRatio = stats?.manualRatio ?? 0;
  const meetingRatio = stats?.meetingRatio ?? 0;

  const activePct = Math.round(activeRatio * 100);
  const idlePct = Math.round(idleRatio * 100);
  const unprodPct = Math.round(unprodRatio * 100);

  // Extra line items
  const extras: string[] = [];
  if (meetingSec > 0)
    extras.push(`Meeting: ${secsToHMS(meetingSec)} (${Math.round(meetingRatio * 100)}%)`);
  if (manualSec > 0)
    extras.push(`Manual: ${secsToHMS(manualSec)} (${Math.round(manualRatio * 100)}%)`);
  if (mobileSec > 0)
    extras.push(`Mobile: ${secsToHMS(mobileSec)} (${Math.round(mobileRatio * 100)}%)`);
  if (paidBreakSec > 0)
    extras.push(`Paid Break: ${secsToHMS(paidBreakSec)}`);

  return (
    <section className="activity-stats-section">
      <button
        className={`activity-stats-toggle${open ? ' activity-stats-toggle--open' : ''}`}
        onClick={handleToggle}
      >
        {/* <span>📊</span> */}
        <span>{open ? 'Hide Activity Stats' : 'View Activity Stats'}</span>
        <span className={`activity-arrow${open ? ' activity-arrow--open' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="activity-stats-panel">
          {!userId && (
            <div className="activity-stats-empty">
              No Mr Time user linked. This employee may not use Mr Time.
            </div>
          )}

          {userId && status === 'loading' && (
            <div className="activity-stats-loading">
              <span className="activity-spinner" />
              Fetching activity stats...
            </div>
          )}

          {userId && status === 'error' && (
            <div className="activity-stats-error">
              {error}
              <button className="activity-retry-btn" onClick={handleRefresh}>
                Retry
              </button>
            </div>
          )}

          {userId && status === 'success' && stats && (
            <>
              <div className="activity-stats-header">
                Today's Activity
                <button className="activity-refresh-btn" onClick={handleRefresh} title="Refresh stats">
                  🔄
                </button>
              </div>

              <div className="activity-stats-grid">
                {/* Activity Level */}
                <div className="activity-stat-card">
                  <div className="activity-stat-label">Activity Level</div>
                  <div className={`activity-stat-value ${getStatColorClass(activePct, 'activity')}`}>
                    {activePct}%
                    {/* <span className="activity-stat-tag">{activityText}</span> */}
                  </div>
                  <div className="activity-stat-bar">
                    <div
                      className="activity-stat-bar-fill activity-bar-active"
                      style={{ width: `${activePct}%` }}
                    />
                  </div>
                  <div className="activity-stat-sub">
                    {secsToHMS(activeSec)} active of {secsToHMS(totalSec)}
                  </div>
                </div>

                {/* Idle % */}
                <div className="activity-stat-card">
                  <div className="activity-stat-label">Idle Minutes %</div>
                  <div className={`activity-stat-value ${getStatColorClass(idlePct, 'idle')}`}>
                    {idlePct}%
                  </div>
                  <div className="activity-stat-bar">
                    <div
                      className="activity-stat-bar-fill activity-bar-idle"
                      style={{ width: `${idlePct}%` }}
                    />
                  </div>
                  <div className="activity-stat-sub">
                    {secsToHMS(idleSec)} idle of {secsToHMS(totalSec)}
                  </div>
                </div>

                {/* Unproductive % */}
                <div className="activity-stat-card">
                  <div className="activity-stat-label">Unproductive %</div>
                  <div className={`activity-stat-value ${getStatColorClass(unprodPct, 'unproductive')}`}>
                    {unprodPct}%
                  </div>
                  <div className="activity-stat-bar">
                    <div
                      className="activity-stat-bar-fill activity-bar-unprod"
                      style={{ width: `${unprodPct}%` }}
                    />
                  </div>
                  <div className="activity-stat-sub">
                    {secsToHMS(unprodSec)} unproductive
                  </div>
                </div>

                {/* Total Time Tracked */}
                <div className="activity-stat-card">
                  <div className="activity-stat-label">Total Time Tracked</div>
                  <div className="activity-stat-value activity-stat-neutral">
                    {secsToHMS(totalSec)}
                  </div>
                  <div className="activity-stat-sub">
                    {extras.length > 0
                      ? extras.map((e, i) => <div key={i}>{e}</div>)
                      : 'Computer only'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
