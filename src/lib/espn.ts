// Thin wrapper around ESPN's public (undocumented) golf scoreboard feed.
// The endpoint sends `Access-Control-Allow-Origin: *`, so we can call it
// straight from the browser with no proxy or API key.

const TOURNAMENT_DATE = '20260618' // 2026 U.S. Open start date (Shinnecock Hills)

export interface EspnCompetitor {
  id: string
  order?: number
  score?: string
  athlete?: { displayName?: string }
  linescores?: EspnLinescore[]
}

export interface EspnHole {
  value?: number // strokes on the hole
  displayValue?: string
  period?: number // hole number (1-18)
  scoreType?: { displayValue?: string } // relative to par on the hole, e.g. "-1", "E"
}

export interface EspnLinescore {
  value?: number
  displayValue?: string
  period?: number
  linescores?: EspnHole[] // hole-by-hole
  statistics?: { categories?: { stats?: { displayValue?: string }[] }[] } // holds tee time
}

export interface EspnScoreboard {
  name: string
  status: {
    period: number
    type: { state: string; completed: boolean; description: string; detail?: string; shortDetail?: string }
  }
  competitors: EspnCompetitor[]
}

export async function fetchScoreboard(eventId: string): Promise<EspnScoreboard> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?dates=${TOURNAMENT_DATE}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ESPN responded ${res.status}`)
  const data = await res.json()
  const events: any[] = data.events ?? []
  if (events.length === 0) throw new Error('No event returned from ESPN')
  const event = events.find((e) => String(e.id) === String(eventId)) ?? events[0]
  const comp = event.competitions?.[0]
  if (!comp) throw new Error('Event has no competition data yet')
  return {
    name: event.name ?? 'U.S. Open',
    status: comp.status,
    competitors: comp.competitors ?? [],
  }
}
