import type { GroupTable, QualificationState } from '../types';
import { TeamCrest } from './badges';

function rowClass(q: QualificationState): string {
  switch (q) {
    case 'QUALIFIED': return 'wc-strow--qualified';
    case 'THIRD_PLACE_WATCH': return 'wc-strow--third';
    case 'ELIMINATED': return 'wc-strow--out';
    default: return '';
  }
}

function GroupCard({ table }: { table: GroupTable }) {
  return (
    <div className="wc-group">
      <div className="wc-group__header">Group {table.group}</div>
      <table className="wc-table">
        <thead>
          <tr>
            <th className="wc-table__pos">#</th>
            <th className="wc-table__team">Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th>
            <th className="wc-table__pts">Pts</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r) => (
            <tr key={r.team.id} className={rowClass(r.qualification)}>
              <td className="wc-table__pos">{r.position}</td>
              <td className="wc-table__team">
                <TeamCrest team={r.team} size={20} />
                <span className="wc-table__name">{r.team.name}</span>
              </td>
              <td>{r.played}</td>
              <td>{r.won}</td>
              <td>{r.drawn}</td>
              <td>{r.lost}</td>
              <td>{r.goalsFor}</td>
              <td>{r.goalsAgainst}</td>
              <td>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className="wc-table__pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Standings({ tables }: { tables: GroupTable[] }) {
  return (
    <div className="wc-standings">
      <div className="wc-legend">
        <span><i className="wc-dot wc-dot--green" /> Top 2 — qualified</span>
        <span><i className="wc-dot wc-dot--amber" /> 3rd — best-thirds watch</span>
        <span><i className="wc-dot wc-dot--out" /> Eliminated</span>
      </div>
      <div className="wc-standings__grid">
        {tables.map((t) => <GroupCard key={t.group} table={t} />)}
      </div>
    </div>
  );
}
