import type { TimeDuration, TimeResult, ScheduleMode, ScheduleConfig } from '../types/time';

export const SCHEDULE_CONFIGS: Record<ScheduleMode, ScheduleConfig> = {
  regular:  { workHours: 7, stayHours: 9 },
  ramadan:  { workHours: 6, stayHours: 7 },
};

/** Convert "HH:MM" string to total minutes since midnight */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert total minutes to TimeDuration (no seconds) */
export function minutesToDuration(totalMinutes: number): TimeDuration {
  const clamped = Math.max(0, totalMinutes);
  return {
    hours: Math.floor(clamped / 60),
    minutes: Math.floor(clamped % 60),
    seconds: 0,
  };
}

/** Convert total seconds to TimeDuration */
export function secondsToDuration(totalSeconds: number): TimeDuration {
  const clamped = Math.max(0, totalSeconds);
  return {
    hours: Math.floor(clamped / 3600),
    minutes: Math.floor((clamped % 3600) / 60),
    seconds: Math.floor(clamped % 60),
  };
}

/** Format TimeDuration to "Xh Ym" */
export function formatDuration(d: TimeDuration): string {
  return `${d.hours}h ${d.minutes}m`;
}

/** Format TimeDuration as countdown "H:MM:SS" */
export function formatCountdown(d: TimeDuration): string {
  return `${d.hours}:${d.minutes.toString().padStart(2, '0')}:${d.seconds.toString().padStart(2, '0')}`;
}

/** Format total seconds as elapsed "Xh Ym Zs" */
export function formatElapsed(totalSeconds: number): string {
  const d = secondsToDuration(totalSeconds);
  return `${d.hours}h ${d.minutes.toString().padStart(2, '0')}m ${d.seconds.toString().padStart(2, '0')}s`;
}

/** Format minutes-since-midnight to "HH:MM AM/PM" */
export function minutesToTimeString(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Convert "HH:MM" time-doctor tracked time to total minutes */
export function timeDoctorToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

/** Main calculation — all pure, no side effects */
export function calculateTimes(
  entryTimeStr: string,
  timeDoctorHours: number,
  timeDoctorMinutes: number,
  now: Date = new Date(),
  tdSetAt: number = Date.now(),
  mode: ScheduleMode = 'ramadan',
): TimeResult {
  const config = SCHEDULE_CONFIGS[mode];
  const REQUIRED_WORK_MINUTES = config.workHours * 60;
  const REQUIRED_STAY_MINUTES = config.stayHours * 60;

  // Current time in seconds since midnight
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // Time Doctor: base input + seconds elapsed since last set
  const baseWorkedSeconds = timeDoctorToMinutes(timeDoctorHours, timeDoctorMinutes) * 60;
  const elapsedSinceSet = Math.max(0, Math.floor((now.getTime() - tdSetAt) / 1000));
  const workedSeconds = baseWorkedSeconds + elapsedSinceSet;

  // 1. Time Doctor remaining (seconds-level)
  const tdRemainingSec = REQUIRED_WORK_MINUTES * 60 - workedSeconds;

  // 2. Entry-based leave time
  const entryMinutes = timeStringToMinutes(entryTimeStr);
  const canLeaveAtMin = entryMinutes + REQUIRED_STAY_MINUTES;
  const stayRemainingSec = canLeaveAtMin * 60 - nowSeconds;

  // 3. Which constraint is bigger?
  const drivingConstraint: 'timeDoctor' | 'entry' =
    tdRemainingSec > stayRemainingSec ? 'timeDoctor' : 'entry';

  // 4. Extra time required = only when TD still has positive remaining AND exceeds office stay
  const extraTimeSec = tdRemainingSec > 0
    ? Math.max(0, tdRemainingSec - Math.max(0, stayRemainingSec))
    : 0;

  // 5. Effective stay remaining = stay + extra time (if TD exceeds stay)
  const effectiveStayRemainingSec = stayRemainingSec + extraTimeSec;
  const effectiveCanLeaveAtMin = canLeaveAtMin + (extraTimeSec / 60);

  // 6. Free time = how much office stay time is NOT consumed by Time Doctor work
  const freeTimeSec = stayRemainingSec - tdRemainingSec;

  // 7. Progress
  const progressPercent = Math.min(
    100,
    Math.max(0, (workedSeconds / (REQUIRED_WORK_MINUTES * 60)) * 100),
  );

  return {
    timeDoctorRemaining: secondsToDuration(tdRemainingSec),
    canLeaveAt: minutesToTimeString(canLeaveAtMin),
    stayRemaining: secondsToDuration(stayRemainingSec),
    extraTimeRequired: secondsToDuration(extraTimeSec),
    effectiveStayRemaining: secondsToDuration(effectiveStayRemainingSec),
    effectiveCanLeaveAt: minutesToTimeString(effectiveCanLeaveAtMin),
    drivingConstraint,
    freeTime: secondsToDuration(freeTimeSec),
    progressPercent: Math.round(progressPercent),
    /** Seconds elapsed since entry */
    entryElapsedSeconds: Math.max(0, nowSeconds - entryMinutes * 60),
    /** Total seconds Time Doctor has tracked */
    tdTrackedSeconds: workedSeconds,
  };
}
