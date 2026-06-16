import { useState } from 'react'
import { Accordion, ActionIcon, Alert, Center, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react'
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

        {standings && view === 'live' && (
          <>
            <Paper radius="lg" p="md" shadow="md" style={{ background: 'linear-gradient(135deg,#0a3161,#143d77)', color: 'white' }}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <ActionIcon variant="white" color="dark" radius="xl" size="lg" onClick={() => setView('pool')} aria-label="Back to pool leaderboard">
                    <IconArrowLeft size={18} />
                  </ActionIcon>
                  <Stack gap={0}>
                    <Title order={3}>U.S. Open Leaderboard</Title>
                    <Text size="xs" style={{ opacity: 0.85 }}>{standings.tournament.detail || 'Full field · Shinnecock Hills'}</Text>
                  </Stack>
                </Group>
                <Text size="xs" style={{ opacity: 0.85 }}>Your golfers are highlighted</Text>
              </Group>
            </Paper>
            <LiveScoreboard rows={standings.leaderboard} t={standings.tournament} />
          </>
        )}

        {standings && view === 'pool' && (
          <>
            <StatusHeader standings={standings} onRefresh={refresh} onShowLive={() => setView('live')} />

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
        )}
      </Stack>
    </Container>
  )
}
