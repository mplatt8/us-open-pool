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

export interface PlayerScore {
  id: string
  name: string
  rounds: (number | null)[] // 4 rounds, strokes (live/partial), null if not played
  roundsDisplay: string[] // 4 rounds, what each contributes: strokes, "85", or "—"
  toPar: string // ESPN relative-to-par string, e.g. "-3", "E", "+5"
  total: number | null // total strokes incl. missed-cut penalties; null before they start
  status: PlayerStatus
  holesThru: number // holes completed in the current round
  position: string // ESPN field order / position label
}

export interface TeamResult {
  owner: string
  players: PlayerScore[]
  countingIds: Set<string> // the (up to) 4 players whose strokes count
  total: number | null // sum of the best 4
}

export interface Tournament {
  name: string
  period: number // current round, 1-4
  state: 'pre' | 'in' | 'post'
  detail: string // human status, e.g. "Final", "Round 2 - In Progress"
  cutLine: number | null // 36-hole cut score (low 60 & ties)
  cutInEffect: boolean
}

export interface Standings {
  tournament: Tournament
  teams: TeamResult[] // sorted best (lowest) first
  updated: Date
}
