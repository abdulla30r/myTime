import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bracket, DataSource, GroupTable, MatchResult } from './types';
import { generateBundledFixtures } from './data';
import { computeStandings } from './standings';
import { buildBracket } from './bracket';
import { isLive } from './time';
import {
  getLiveMatches, getLiveStandings, loadMatchDetail,
  hasFdAccess, hasEventsAccess,
} from './api';

export interface MatchDetailState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  goals: MatchResult['goals'];
  motm?: MatchResult['manOfTheMatch'];
  error?: string;
}

export interface WorldCupState {
  fixtures: MatchResult[];
  standings: GroupTable[];
  bracket: Bracket;
  source: DataSource;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  eventsEnabled: boolean;
  refresh: () => void;
  details: Record<number, MatchDetailState>;
  loadDetail: (match: MatchResult) => void;
}

const BUNDLED = generateBundledFixtures();

export function useWorldCup(): WorldCupState {
  const [fixtures, setFixtures] = useState<MatchResult[]>(BUNDLED);
  const [liveStandings, setLiveStandings] = useState<GroupTable[] | null>(null);
  const [source, setSource] = useState<DataSource>('bundled');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, MatchDetailState>>({});
  const reqId = useRef(0);

  const fetchLive = useCallback(async () => {
    if (!hasFdAccess()) {
      setSource('bundled');
      setFixtures(BUNDLED);
      setLiveStandings(null);
      return;
    }
    const myReq = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const [matches, standings] = await Promise.all([
        getLiveMatches(),
        getLiveStandings().catch(() => null), // standings can 404 before group stage ends
      ]);
      if (myReq !== reqId.current) return; // a newer request superseded this one
      setFixtures(matches.length ? matches : BUNDLED);
      setLiveStandings(standings);
      setSource(matches.length ? 'live' : 'bundled');
      setLastUpdated(Date.now());
    } catch (e: any) {
      if (myReq !== reqId.current) return;
      setError(e?.message ?? 'Failed to load live data');
      setSource('bundled');
      setFixtures(BUNDLED);
    } finally {
      if (myReq === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // Live polling: only while a match is in play (spec §11) — no timers otherwise
  const anyLive = useMemo(() => fixtures.some((m) => isLive(m.status)), [fixtures]);
  useEffect(() => {
    if (!anyLive || !hasFdAccess()) return;
    const id = setInterval(() => { fetchLive(); }, 60_000);
    return () => clearInterval(id);
  }, [anyLive, fetchLive]);

  const standings = useMemo(
    () => liveStandings ?? computeStandings(fixtures),
    [liveStandings, fixtures],
  );
  const bracket = useMemo(() => buildBracket(fixtures), [fixtures]);

  const loadDetail = useCallback((match: MatchResult) => {
    if (!hasEventsAccess()) return;
    setDetails((prev) => {
      const cur = prev[match.id];
      if (cur && (cur.status === 'loading' || cur.status === 'loaded')) return prev;
      return { ...prev, [match.id]: { status: 'loading', goals: [] } };
    });
    loadMatchDetail(match)
      .then((d) => setDetails((prev) => ({
        ...prev,
        [match.id]: { status: 'loaded', goals: d.goals, motm: d.manOfTheMatch },
      })))
      .catch((e) => setDetails((prev) => ({
        ...prev,
        [match.id]: { status: 'error', goals: [], error: e?.message ?? 'Failed' },
      })));
  }, []);

  return {
    fixtures, standings, bracket, source, loading, error, lastUpdated,
    eventsEnabled: hasEventsAccess(),
    refresh: fetchLive,
    details, loadDetail,
  };
}
