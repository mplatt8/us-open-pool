import type { EspnCompetitor, EspnLinescore, EspnScoreboard } from './espn'
import type {
  HoleScore,
  PlayerScore,
  PlayerStatus,
  RoundDetail,
  Standings,
  TeamResult,
  TeamsFile,
  Tournament,
} from './types'

export const MISSED_CUT_PENALTY = 85 // strokes per missed day
const FIELD_CUT_SIZE = 60 // U.S. Open: low 60 and ties
const COUNTING_PLAYERS = 4 // best 4 of 6 strokes count

// Strokes for one round: prefer the round total, fall back to summing the
// holes played so a round in progress still contributes a live partial.
function roundStrokes(ls: EspnLinescore | undefined): number | null {
  if (!ls) return null
  if (typeof ls.value === 'number' && ls.value > 0) return ls.value
  if (Array.isArray(ls.linescores) && ls.linescores.length) {
    const sum = ls.linescores.reduce((a, h) => a + (typeof h.value === 'number' ? h.value : 0), 0)
    return sum > 0 ? sum : null
  }
  return null
}

function holesPlayed(ls: EspnLinescore | undefined): number {
  if (ls && Array.isArray(ls.linescores)) {
    return ls.linescores.filter((h) => typeof h.value === 'number' && h.value > 0).length
  }
  return 0
}

function parseRel(s: string | undefined): number {
  if (!s || s === 'E') return 0
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? 0 : n
}

// ESPN stores the round's tee time as a stat whose displayValue is a date
// string like "Thu Jun 12 07:07:00 PDT 2025". Pull out the clock time only
// (tournament-local) and format it 12-hour; tz parsing is unreliable so skip it.
function extractTeeTime(ls: EspnLinescore | undefined): string | null {
  const stats = ls?.statistics?.categories?.[0]?.stats ?? []
  for (const s of stats) {
    const m = s.displayValue?.match(/\b(\d{1,2}):(\d{2}):\d{2}\b/)
    if (m) {
      let h = parseInt(m[1], 10)
      const min = m[2]
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${h}:${min} ${ampm}`
    }
  }
  return null
}

function extractHoles(ls: EspnLinescore | undefined): HoleScore[] {
  if (!ls || !Array.isArray(ls.linescores)) return []
  return ls.linescores
    .filter((h) => typeof h.value === 'number' && h.value > 0 && typeof h.period === 'number')
    .map((h) => {
      const strokes = h.value as number
      const rel = parseRel(h.scoreType?.displayValue)
      return { hole: h.period as number, strokes, par: strokes - rel, rel }
    })
    .sort((a, b) => a.hole - b.hole)
}

function buildRoundDetails(comp: EspnCompetitor): RoundDetail[] {
  return [0, 1, 2, 3].map((i) => ({
    teeTime: extractTeeTime(comp.linescores?.[i]),
    holes: extractHoles(comp.linescores?.[i]),
  }))
}

function parseTournament(board: EspnScoreboard): Tournament {
  const st = board.status
  const state = (st.type.state as Tournament['state']) ?? 'pre'
  const period = st.period ?? 0
  const cutInEffect = state !== 'pre' && period >= 3
  return {
    name: board.name,
    period,
    state,
    detail: st.type.shortDetail ?? st.type.description ?? '',
    cutLine: null,
    cutInEffect,
  }
}

// Cut line = the 36-hole score of the player in 60th place (ties included).
function computeCutLine(competitors: EspnCompetitor[]): number | null {
  const totals: number[] = []
  for (const c of competitors) {
    const r1 = roundStrokes(c.linescores?.[0])
    const r2 = roundStrokes(c.linescores?.[1])
    if (r1 != null && r2 != null) totals.push(r1 + r2)
  }
  if (totals.length === 0) return null
  totals.sort((a, b) => a - b)
  return totals.length >= FIELD_CUT_SIZE ? totals[FIELD_CUT_SIZE - 1] : totals[totals.length - 1]
}

const DASH = '—'

function scorePlayer(
  id: string,
  name: string,
  comp: EspnCompetitor | undefined,
  t: Tournament,
): PlayerScore {
  // Not in the field (withdrew / never entered): full penalty once underway.
  if (!comp) {
    const started = t.state !== 'pre'
    return {
      id,
      name,
      rounds: [null, null, null, null],
      roundsDisplay: started ? ['85', '85', '85', '85'] : [DASH, DASH, DASH, DASH],
      roundDetails: [0, 1, 2, 3].map(() => ({ teeTime: null, holes: [] })),
      toPar: '-',
      total: started ? MISSED_CUT_PENALTY * 4 : null,
      status: 'notfound',
      holesThru: 0,
      position: '-',
    }
  }

  const rounds = [0, 1, 2, 3].map((i) => roundStrokes(comp.linescores?.[i]))
  const roundDetails = buildRoundDetails(comp)
  const [r1, r2] = rounds
  const toPar = comp.score ?? 'E'
  const position = comp.order != null ? String(comp.order) : '-'
  const thru = t.period >= 1 ? holesPlayed(comp.linescores?.[t.period - 1]) : 0

  if (t.state === 'pre') {
    return { id, name, rounds, roundsDisplay: [DASH, DASH, DASH, DASH], roundDetails, toPar, total: null, status: 'pre', holesThru: thru, position }
  }

  const madeCut = t.cutInEffect && r1 != null && r2 != null && t.cutLine != null && r1 + r2 <= t.cutLine
  const missedCut = t.cutInEffect && !madeCut
  const status: PlayerStatus = !t.cutInEffect ? 'active' : missedCut ? 'cut' : 'made'

  // Walk the four rounds once, building both the running total and what each
  // round contributes for display. A round with no posted score counts as the
  // 85 penalty when the player is cut (R3/R4) or when that round is already
  // over (a withdrawal); otherwise it simply hasn't been played yet.
  const roundsDisplay: string[] = []
  let total = 0
  let counted = 0
  for (let idx = 0; idx < 4; idx++) {
    const v = rounds[idx]
    const roundNum = idx + 1
    if (v != null) {
      total += v
      roundsDisplay.push(String(v))
      counted++
      continue
    }
    const roundOver = roundNum < t.period || (roundNum === t.period && t.state === 'post')
    if ((missedCut && roundNum >= 3) || roundOver) {
      total += MISSED_CUT_PENALTY
      roundsDisplay.push(String(MISSED_CUT_PENALTY))
      counted++
    } else {
      roundsDisplay.push(DASH) // not played yet
    }
  }

  return { id, name, rounds, roundsDisplay, roundDetails, toPar, total: counted > 0 ? total : null, status, holesThru: thru, position }
}

function pickCounting(players: PlayerScore[]): { ids: Set<string>; total: number | null; tiebreak: number[] } {
  const scored = players.filter((p) => p.total != null).sort((a, b) => a.total! - b.total!)
  const counting = scored.slice(0, COUNTING_PLAYERS)
  // Tiebreaker: the next lowest scores after the counting four (5th, then 6th).
  const rest = scored.slice(COUNTING_PLAYERS).map((p) => p.total!)
  return {
    ids: new Set(counting.map((p) => p.id)),
    total: counting.length ? counting.reduce((a, p) => a + p.total!, 0) : null,
    tiebreak: [rest[0] ?? Infinity, rest[1] ?? Infinity],
  }
}

// Full ordering key: best-4 total, then 5th-lowest, then 6th-lowest.
// Lower is better; missing values sort last.
function rankKey(t: TeamResult): number[] {
  return [t.total ?? Infinity, ...t.tiebreak]
}

function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

export function computeStandings(teamsFile: TeamsFile, board: EspnScoreboard): Standings {
  const tournament = parseTournament(board)
  if (tournament.cutInEffect) tournament.cutLine = computeCutLine(board.competitors)

  const byId = new Map<string, EspnCompetitor>()
  for (const c of board.competitors) byId.set(String(c.id), c)

  const teams: TeamResult[] = teamsFile.teams.map((team) => {
    const players = team.players.map((p) => scorePlayer(p.id, p.name, byId.get(p.id), tournament))
    const { ids, total, tiebreak } = pickCounting(players)
    return { owner: team.owner, players, countingIds: ids, total, tiebreak }
  })

  teams.sort((a, b) => compareKeys(rankKey(a), rankKey(b)))

  return { tournament, teams, updated: new Date() }
}

export interface Position {
  label: string // "1", "T1", "T3", … — shared when teams are tied
  medalRank: number | null // 1-3 only when that position is uniquely held
}

// Standard competition ranking (1-2-2-4). Teams with equal totals share a
// position shown with a "T" prefix. Before anyone has a score every team is
// null and therefore tied (all "T1").
export function computePositions(teams: TeamResult[]): Position[] {
  // Teams share a position only when their best-4 total AND both tiebreakers
  // match — the 5th/6th-lowest tiebreaker separates otherwise-equal teams.
  const sameRank = (a: TeamResult, b: TeamResult) => compareKeys(rankKey(a), rankKey(b)) === 0

  return teams.map((team, i) => {
    let first = i
    while (first > 0 && sameRank(teams[first - 1], team)) first--
    const rank = first + 1
    const tied =
      (i > 0 && sameRank(teams[i - 1], team)) ||
      (i < teams.length - 1 && sameRank(teams[i + 1], team))
    const medalRank = !tied && rank <= 3 && team.total != null ? rank : null
    return { label: (tied ? 'T' : '') + rank, medalRank }
  })
}
