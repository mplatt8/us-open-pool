import { Accordion, Alert, Center, Container, Loader, Stack, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Countdown } from './components/Countdown'
import { StatusHeader } from './components/StatusHeader'
import { TeamRow } from './components/TeamRow'
import { computePositions } from './lib/scoring'
import { useStandings } from './lib/useStandings'

export function App() {
  const { standings, error, loading, refresh } = useStandings()
  const positions = standings ? computePositions(standings.teams) : []

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {standings && <StatusHeader standings={standings} onRefresh={refresh} />}

        <Countdown />

        {loading && !standings && (
          <Center py={60}>
            <Stack align="center" gap="sm">
              <Loader color="usga" />
              <Text c="dimmed">Loading live scores…</Text>
            </Stack>
          </Center>
        )}

        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />} radius="md" title="Couldn't reach the scoreboard">
            {error}. Retrying automatically every 60 seconds.
          </Alert>
        )}

        {standings && (
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
        )}

        <Text ta="center" size="xs" c="dimmed" mt="md">
          Scores via ESPN · Team = lowest 4 of 6 golfers' total strokes · Missed cut = 85 strokes per day
        </Text>
      </Stack>
    </Container>
  )
}
