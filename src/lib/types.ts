export interface RosterPlayer {
  id: string
  name: string
}

export interface Team {
  owner: string
  players: RosterPlayer[]
}

export interface TeamsFile {
  event: string
  eventId: string
  teams: Team[]
}

export type PlayerStatus = 'pre' | 'active' | 'made' | 'cut' | 'notfound'

export interface HoleScore {
  hole: number // 1-18
  strokes: number
  par: number
  rel: number // strokes relative to par on this hole (birdie = -1)
}

export interface RoundDetail {
  teeTime: string | null // formatted local tee time, e.g. "7:07 AM", if published
  holes: HoleScore[] // hole-by-hole, sorted 1-18; partial while a round is in play
}

export interface PlayerScore {
  id: string
  name: string
  rounds: (number | null)[] // 4 rounds, strokes (live/partial), null if not played
  roundsDisplay: string[] // 4 rounds, what each contributes: strokes, "85", or "—"
  roundDetails: RoundDetail[] // 4 rounds of tee time + hole-by-hole data
  toPar: string // ESPN relative-to-par string, e.g. "-3", "E", "+5"
  scoreToPar: number | null // total strokes relative to par for everything counted
  total: number | null // total strokes incl. missed-cut penalties; null before they start
  status: PlayerStatus
  holesThru: number // holes completed in the current round
  position: string // ESPN field order / position label
}

export interface TeamResult {
  owner: string
  players: PlayerScore[]
  countingIds: Set<string> // the (up to) 4 players whose strokes count
  total: number | null // sum of the best 4 (strokes)
  toPar: number | null // sum of the best 4 relative to par
  tiebreak: number[] // [5th-lowest, 6th-lowest] strokes; Infinity if absent
}

export interface Tournament {
  name: string
  period: number // current round, 1-4
  state: 'pre' | 'in' | 'post'
  detail: string // human status, e.g. "Final", "Round 2 - In Progress"
  cutLine: number | null // 36-hole cut score (low 60 & ties)
  cutInEffect: boolean
}

export interface LeaderboardRow {
  id: string
  name: string
  flag: string | null // country flag image url
  owner: string | null // pool team owner, if this golfer is rostered
  position: string // "T3", "CUT", or "" pre-tournament
  toPar: string // overall score relative to par
  toParNum: number | null
  today: string | null // current round relative to par
  thru: string // "F", "12", tee time, or "—"
  rounds: (number | null)[] // round strokes
  totalStrokes: number | null // actual strokes played (no pool penalties)
  cut: boolean
}

export interface Standings {
  tournament: Tournament
  teams: TeamResult[] // sorted best (lowest) first
  leaderboard: LeaderboardRow[] // the real tournament field, ESPN order
  updated: Date
}
