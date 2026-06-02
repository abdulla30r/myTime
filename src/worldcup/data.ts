// ── Bundled FIFA World Cup 2026 dataset ──
// Source of truth at runtime is the live football-data.org feed (when a token is
// configured). This bundle is the zero-token fallback so the tab is never empty.
//
// ACCURATE: the 12 groups + 48 teams below are the real Final Draw result
// (drawn 5 Dec 2025, Washington D.C.).
// PROVISIONAL: per-match kickoff dates/times/venues are generated to a plausible
// structure (correct match count, correct group-stage / knockout date windows) and
// are OVERRIDDEN by exact values from the live API once a token is added.

import type { MatchResult, Team, Stage } from './types';

interface RawTeam {
  name: string;
  fifa: string;
}

// ── The Final Draw (Groups A–L) ──
export const GROUPS: { group: string; teams: RawTeam[] }[] = [
  { group: 'A', teams: [{ name: 'Mexico', fifa: 'MEX' }, { name: 'South Africa', fifa: 'RSA' }, { name: 'South Korea', fifa: 'KOR' }, { name: 'Czech Republic', fifa: 'CZE' }] },
  { group: 'B', teams: [{ name: 'Canada', fifa: 'CAN' }, { name: 'Bosnia and Herzegovina', fifa: 'BIH' }, { name: 'Qatar', fifa: 'QAT' }, { name: 'Switzerland', fifa: 'SUI' }] },
  { group: 'C', teams: [{ name: 'Brazil', fifa: 'BRA' }, { name: 'Morocco', fifa: 'MAR' }, { name: 'Haiti', fifa: 'HAI' }, { name: 'Scotland', fifa: 'SCO' }] },
  { group: 'D', teams: [{ name: 'United States', fifa: 'USA' }, { name: 'Paraguay', fifa: 'PAR' }, { name: 'Australia', fifa: 'AUS' }, { name: 'Turkey', fifa: 'TUR' }] },
  { group: 'E', teams: [{ name: 'Germany', fifa: 'GER' }, { name: 'Curaçao', fifa: 'CUW' }, { name: 'Ivory Coast', fifa: 'CIV' }, { name: 'Ecuador', fifa: 'ECU' }] },
  { group: 'F', teams: [{ name: 'Netherlands', fifa: 'NED' }, { name: 'Japan', fifa: 'JPN' }, { name: 'Sweden', fifa: 'SWE' }, { name: 'Tunisia', fifa: 'TUN' }] },
  { group: 'G', teams: [{ name: 'Belgium', fifa: 'BEL' }, { name: 'Egypt', fifa: 'EGY' }, { name: 'Iran', fifa: 'IRN' }, { name: 'New Zealand', fifa: 'NZL' }] },
  { group: 'H', teams: [{ name: 'Spain', fifa: 'ESP' }, { name: 'Cape Verde', fifa: 'CPV' }, { name: 'Saudi Arabia', fifa: 'KSA' }, { name: 'Uruguay', fifa: 'URU' }] },
  { group: 'I', teams: [{ name: 'France', fifa: 'FRA' }, { name: 'Senegal', fifa: 'SEN' }, { name: 'Iraq', fifa: 'IRQ' }, { name: 'Norway', fifa: 'NOR' }] },
  { group: 'J', teams: [{ name: 'Argentina', fifa: 'ARG' }, { name: 'Algeria', fifa: 'ALG' }, { name: 'Austria', fifa: 'AUT' }, { name: 'Jordan', fifa: 'JOR' }] },
  { group: 'K', teams: [{ name: 'Portugal', fifa: 'POR' }, { name: 'DR Congo', fifa: 'COD' }, { name: 'Uzbekistan', fifa: 'UZB' }, { name: 'Colombia', fifa: 'COL' }] },
  { group: 'L', teams: [{ name: 'England', fifa: 'ENG' }, { name: 'Croatia', fifa: 'CRO' }, { name: 'Ghana', fifa: 'GHA' }, { name: 'Panama', fifa: 'PAN' }] },
];

// ── Host venues with their UTC offset for the (Jun–Jul 2026) tournament window ──
// US/Canada are on DST in summer; Mexico abolished DST (2022) → fixed UTC−6.
interface Venue { city: string; stadium: string; offset: number }
export const VENUES: Venue[] = [
  { city: 'Mexico City', stadium: 'Estadio Azteca', offset: -6 },
  { city: 'Guadalajara', stadium: 'Estadio Akron', offset: -6 },
  { city: 'Monterrey', stadium: 'Estadio BBVA', offset: -6 },
  { city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', offset: -4 },
  { city: 'Boston', stadium: 'Gillette Stadium', offset: -4 },
  { city: 'Miami', stadium: 'Hard Rock Stadium', offset: -4 },
  { city: 'New York New Jersey', stadium: 'MetLife Stadium', offset: -4 },
  { city: 'Philadelphia', stadium: 'Lincoln Financial Field', offset: -4 },
  { city: 'Toronto', stadium: 'BMO Field', offset: -4 },
  { city: 'Dallas', stadium: 'AT&T Stadium', offset: -5 },
  { city: 'Houston', stadium: 'NRG Stadium', offset: -5 },
  { city: 'Kansas City', stadium: 'Arrowhead Stadium', offset: -5 },
  { city: 'Los Angeles', stadium: 'SoFi Stadium', offset: -7 },
  { city: 'San Francisco Bay Area', stadium: "Levi's Stadium", offset: -7 },
  { city: 'Seattle', stadium: 'Lumen Field', offset: -7 },
  { city: 'Vancouver', stadium: 'BC Place', offset: -7 },
];

function makeTeam(group: string, pos: number, raw: RawTeam): Team {
  // synthetic negative id so bundled teams never collide with live football-data.org ids
  return { id: -((group.charCodeAt(0) - 64) * 10 + pos), name: raw.name, fifa: raw.fifa };
}

/** Wall-clock kickoff at a venue → UTC ISO. offset is the venue's UTC offset (e.g. −4). */
function utcIso(y: number, mo: number, d: number, hh: number, mm: number, offset: number): string {
  return new Date(Date.UTC(y, mo - 1, d, hh - offset, mm, 0)).toISOString();
}

// Round-robin pairings for a 4-team group (covers all 6 pairs across 3 match days)
const PAIRS: [number, number][] = [
  [0, 1], [2, 3], // matchday 1
  [0, 2], [3, 1], // matchday 2
  [3, 0], [1, 2], // matchday 3
];
const MD_OF_MATCH = [0, 0, 1, 1, 2, 2];
const KICK_HOURS = [18, 21, 12, 15, 18, 21]; // provisional local kickoff hours

/** Generate all 104 fixtures (72 group + 32 knockout placeholders) for offline mode. */
export function generateBundledFixtures(): MatchResult[] {
  const out: MatchResult[] = [];
  let matchNo = 1;

  // ── 72 group-stage matches ──
  GROUPS.forEach((g, gi) => {
    const teams = g.teams.map((t, i) => makeTeam(g.group, i, t));
    PAIRS.forEach((pair, mi) => {
      const md = MD_OF_MATCH[mi];
      const day = md === 0 ? 11 + Math.floor(gi / 2)
        : md === 1 ? 17 + Math.floor(gi / 2)
          : 23 + Math.floor(gi / 3);
      const venue = VENUES[(gi + mi) % VENUES.length];
      out.push({
        id: 100000 + matchNo, // synthetic; live API uses real ids
        matchNo,
        home: teams[pair[0]],
        away: teams[pair[1]],
        kickoffUtc: utcIso(2026, 6, day, KICK_HOURS[mi], 0, venue.offset),
        status: 'SCHEDULED',
        homeScore: undefined,
        awayScore: undefined,
        stage: 'GROUP_STAGE',
        group: g.group,
        venue: venue.stadium,
        city: venue.city,
        goals: [],
      });
      matchNo += 1;
    });
  });

  // ── 32 knockout placeholders (teams TBD until the live feed fills them) ──
  const KO: { stage: Stage; count: number; startDay: number; spanDays: number }[] = [
    { stage: 'LAST_32', count: 16, startDay: 28, spanDays: 6 }, // Jun 28 – Jul 3
    { stage: 'LAST_16', count: 8, startDay: 34, spanDays: 4 },  // Jul 4 – 7
    { stage: 'QUARTER_FINALS', count: 4, startDay: 39, spanDays: 3 }, // Jul 9 – 11
    { stage: 'SEMI_FINALS', count: 2, startDay: 44, spanDays: 2 },    // Jul 14 – 15
    { stage: 'THIRD_PLACE', count: 1, startDay: 48, spanDays: 1 },    // Jul 18
    { stage: 'FINAL', count: 1, startDay: 49, spanDays: 1 },          // Jul 19
  ];
  // day index 1 == Jun 1 → convert to month/day
  const toMonthDay = (dayIndex: number): [number, number] =>
    dayIndex <= 30 ? [6, dayIndex] : [7, dayIndex - 30];

  KO.forEach(({ stage, count, startDay, spanDays }) => {
    for (let i = 0; i < count; i += 1) {
      const [mo, d] = toMonthDay(startDay + (i % spanDays));
      const venue = VENUES[(matchNo + i) % VENUES.length];
      const tbd: Team = { id: -9000 - matchNo, name: 'TBD', fifa: '?' };
      out.push({
        id: 100000 + matchNo,
        matchNo,
        home: { ...tbd, id: -9000 - matchNo * 2 },
        away: { ...tbd, id: -9000 - matchNo * 2 - 1 },
        kickoffUtc: utcIso(2026, mo, d, 18, 0, venue.offset),
        status: 'SCHEDULED',
        stage,
        venue: venue.stadium,
        city: venue.city,
        goals: [],
      });
      matchNo += 1;
    }
  });

  return out;
}
