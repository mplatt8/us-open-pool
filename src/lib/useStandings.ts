import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchScoreboard } from './espn'
import { computeStandings } from './scoring'
import type { Standings, TeamsFile } from './types'

const REFRESH_MS = 60_000

export function useStandings() {
  const [standings, setStandings] = useState<Standings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const teamsRef = useRef<TeamsFile | null>(null)

  const load = useCallback(async () => {
    try {
      if (!teamsRef.current) {
        const res = await fetch(`${import.meta.env.BASE_URL}teams.json`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Could not load teams.json (${res.status})`)
        teamsRef.current = await res.json()
      }
      const board = await fetchScoreboard(teamsRef.current!.eventId)
      setStandings(computeStandings(teamsRef.current!, board))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return { standings, error, loading, refresh: load }
}
