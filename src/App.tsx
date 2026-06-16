import { useState } from 'react'
import { Accordion, Alert, Center, Container, Loader, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Countdown } from './components/Countdown'
import { LiveScoreboard } from './components/LiveScoreboard'
import { StatusHeader } from './components/StatusHeader'
import { TeamRow } from './components/TeamRow'
import { computePositions } from './lib/scoring'
import { useStandings } from './lib/useStandings'

export function App() {
  const { standings, error, loading, refresh } = useStandings()
  const [view, setView] = useState<'pool' | 'live'>('pool')
  const positions = standings ? computePositions(standings.teams) : []

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />} radius="md" title="Couldn't reach the scoreboard">
            {error}. Retrying automatically every 60 seconds.
          </Alert>
        )}

        {loading && !standings && (
          <Center py={60}>
            <Stack align="center" gap="sm">
              <Loader color="usga" />
              <Text c="dimmed">Loading live scores…</Text>
            </Stack>
          </Center>
        )}

        {standings && (
          <>
            {view === 'pool' ? (
              <StatusHeader standings={standings} onRefresh={refresh} />
            ) : (
              <Paper radius="lg" p="lg" shadow="md" style={{ background: 'linear-gradient(135deg,#0a3161,#143d77)', color: 'white' }}>
                <Title order={2}>U.S. Open Leaderboard</Title>
                <Text size="sm" style={{ opacity: 0.85 }}>
                  Full field · {standings.tournament.detail || 'Shinnecock Hills'} · your golfers highlighted
                </Text>
              </Paper>
            )}

            {/* Always-visible view switch */}
            <SegmentedControl
              fullWidth
              size="md"
              radius="md"
              value={view}
              onChange={(v) => setView(v as 'pool' | 'live')}
              data={[
                { label: '🏆 Pool Leaderboard', value: 'pool' },
                { label: '⛳ Live U.S. Open Scoreboard', value: 'live' },
              ]}
            />

            {view === 'pool' ? (
              <>
                <Countdown />
                <Accordion variant="filled" chevronPosition="right" multiple defaultValue={[standings.teams[0]?.owner]}>
                  {standings.teams.map((team, i) => (
                    <TeamRow
                      key={team.owner}
                      team={team}
                      position={positions[i]}
                      t={standings.tournament}
                      leaderTotal={standings.teams[0]?.total ?? null}
                    />
                  ))}
                </Accordion>
                <Text ta="center" size="xs" c="dimmed" mt="md">
                  Scores via ESPN · Team = lowest 4 of 6 golfers' total strokes · Missed cut = 85 strokes per day
                </Text>
              </>
            ) : (
              <LiveScoreboard rows={standings.leaderboard} t={standings.tournament} />
            )}
          </>
        )}
      </Stack>
    </Container>
  )
}
