import type { EspnCompetitor, EspnLinescore, EspnScoreboard } from './espn'
import type {
  PlayerScore,
  PlayerStatus,
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
      toPar: '-',
      total: started ? MISSED_CUT_PENALTY * 4 : null,
      status: 'notfound',
      holesThru: 0,
      position: '-',
    }
  }

  const rounds = [0, 1, 2, 3].map((i) => roundStrokes(comp.linescores?.[i]))
  const [r1, r2] = rounds
  const toPar = comp.score ?? 'E'
  const position = comp.order != null ? String(comp.order) : '-'
  const thru = t.period >= 1 ? holesPlayed(comp.linescores?.[t.period - 1]) : 0

  if (t.state === 'pre') {
    return { id, name, rounds, roundsDisplay: [DASH, DASH, DASH, DASH], toPar, total: null, status: 'pre', holesThru: thru, position }
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

  return { id, name, rounds, roundsDisplay, toPar, total: counted > 0 ? total : null, status, holesThru: thru, position }
}

function pickCounting(players: PlayerScore[]): { ids: Set<string>; total: number | null } {
  const scored = players.filter((p) => p.total != null).sort((a, b) => a.total! - b.total!)
  if (scored.length === 0) return { ids: new Set(), total: null }
  const counting = scored.slice(0, COUNTING_PLAYERS)
  return {
    ids: new Set(counting.map((p) => p.id)),
    total: counting.reduce((a, p) => a + p.total!, 0),
  }
}

export function computeStandings(teamsFile: TeamsFile, board: EspnScoreboard): Standings {
  const tournament = parseTournament(board)
  if (tournament.cutInEffect) tournament.cutLine = computeCutLine(board.competitors)

  const byId = new Map<string, EspnCompetitor>()
  for (const c of board.competitors) byId.set(String(c.id), c)

  const teams: TeamResult[] = teamsFile.teams.map((team) => {
    const players = team.players.map((p) => scorePlayer(p.id, p.name, byId.get(p.id), tournament))
    const { ids, total } = pickCounting(players)
    return { owner: team.owner, players, countingIds: ids, total }
  })

  teams.sort((a, b) => {
    if (a.total == null && b.total == null) return 0
    if (a.total == null) return 1
    if (b.total == null) return -1
    return a.total - b.total
  })

  return { tournament, teams, updated: new Date() }
}
