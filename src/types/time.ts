/** Schedule mode */
export type ScheduleMode = 'regular' | 'ramadan';

/** Config per mode */
export interface ScheduleConfig {
  workHours: number;   // Time Doctor required
  stayHours: number;   // Office stay required
}

/** Represents hours, minutes, and seconds */
export interface TimeDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

/** All calculated results for display */
export interface TimeResult {
  /** How much Time Doctor work is left (out of 6h) */
  timeDoctorRemaining: TimeDuration;
  /** When you can leave based on entry time + 7h */
  canLeaveAt: string;
  /** Time left until you can leave (entry-based) */
  stayRemaining: TimeDuration;
  /** Extra time required beyond office stay (TD remaining - stay remaining, or 0) */
  extraTimeRequired: TimeDuration;
  /** Which constraint is driving: 'timeDoctor' | 'entry' */
  drivingConstraint: 'timeDoctor' | 'entry';
  /** Free time = stay time remaining - time doctor remaining */
  freeTime: TimeDuration;
  /** Total progress percentage (Time Doctor) */
  progressPercent: number;
  /** Seconds elapsed since entry time */
  entryElapsedSeconds: number;
  /** Total seconds Time Doctor has tracked */
  tdTrackedSeconds: number;
}
