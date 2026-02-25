/**
 * Employee mapping: RAMS name → Time Doctor name.
 *
 * Key   = RAMS employee name (exactly as it appears in RAMS dropdown, WITHOUT the ID portion).
 *         The lookup strips everything from " (" onward, trims, and lowercases.
 * Value = Time Doctor user name (exactly as returned by TD /users API),
 *         or null if the employee does NOT use Time Doctor.
 *
 * To add / remove employees, simply edit this map.
 */
const RAW_MAP: Record<string, string | null> = {
  // ── Employees WITH Time Doctor ──
  'abdulla':              'Abdulla',
  'abdullah2':            'Abdullah2',
  'ador':                 'Ador',
  'donald jerry':         'Donald',
  'ifte kharul':          'Ifte',
  'towsif':               'Towsif Ahmed Khalid',
  'ismail':               'Ismail',
  'sakib':                'Sakib',
  'jewel':                'Jewel Chakma',
  'rabiul':               'Rabiul Ahsan',
  'tanveer':              'Tanveer',
  'mahbubur':             'Mahbubur',
  'azim':                 'Arshil',

  // ── Employees WITHOUT Time Doctor (show N/A) ──
  'himel baidya':         null,
  'yasmin':               null,
  'mubin':                null,
  'sheema':               null,
  'mahedy hasan':         null,
  'shafiq':               null,
};

/**
 * Normalise a RAMS name for lookup.
 * "Abdulla (100025)" → "abdulla"
 * "DONALD JERRY (2)" → "donald jerry"
 */
function normalise(ramsName: string): string {
  return ramsName.replace(/\s*\(.*$/, '').trim().toLowerCase();
}

/**
 * Given a RAMS employee name, find the matching Time Doctor user name.
 * Returns:
 *   - `string` — the TD name to look up in TD records
 *   - `null`   — employee exists in map but has no TD (show N/A)
 *   - `undefined` — employee not in map at all (treat as no TD)
 */
export function getTDNameForRAMS(ramsName: string): string | null | undefined {
  const key = normalise(ramsName);
  if (key in RAW_MAP) return RAW_MAP[key];
  return undefined;
}

/**
 * Check whether a RAMS employee uses Time Doctor.
 */
export function hasTD(ramsName: string): boolean {
  const td = getTDNameForRAMS(ramsName);
  return typeof td === 'string';
}
