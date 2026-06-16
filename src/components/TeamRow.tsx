import { Accordion, Badge, Box, Group, Stack, Table, Text } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import type { PlayerScore, TeamResult, Tournament } from '../lib/types'

const RANK_COLORS = ['#caa42a', '#9aa3ad', '#b07c47'] // gold / silver / bronze

function PlayerStatusBadge({ p, t }: { p: PlayerScore; t: Tournament }) {
  if (p.status === 'cut') return <Badge color="red" variant="light" size="sm">Missed cut</Badge>
  if (p.status === 'notfound') return <Badge color="red" variant="outline" size="sm">Not in field</Badge>
  if (p.status === 'made') return <Badge color="green" variant="light" size="sm">Made cut</Badge>
  if (p.status === 'active' && t.state === 'in') {
    const thru = p.holesThru >= 18 ? 'F' : p.holesThru > 0 ? `Thru ${p.holesThru}` : 'Tee time'
    return <Badge color="blue" variant="light" size="sm">{thru}</Badge>
  }
  return null
}

function PlayerTable({ team, t }: { team: TeamResult; t: Tournament }) {
  // Show counting players first, then the rest, each in ascending strokes.
  const sorted = [...team.players].sort((a, b) => {
    const av = a.total ?? Infinity
    const bv = b.total ?? Infinity
    return av - bv
  })
  return (
    <Table verticalSpacing="xs" horizontalSpacing="md" highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Golfer</Table.Th>
          <Table.Th ta="center">R1</Table.Th>
          <Table.Th ta="center">R2</Table.Th>
          <Table.Th ta="center">R3</Table.Th>
          <Table.Th ta="center">R4</Table.Th>
          <Table.Th ta="right">Total</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sorted.map((p) => {
          const counts = team.countingIds.has(p.id)
          return (
            <Table.Tr
              key={p.id}
              style={{
                background: counts ? 'rgba(34,139,76,0.08)' : undefined,
                opacity: counts || p.total == null ? 1 : 0.6,
              }}
            >
              <Table.Td>
                <Group gap={8} wrap="nowrap">
                  {counts ? (
                    <IconCheck size={16} color="#228b4c" stroke={3} />
                  ) : (
                    <Box w={16} />
                  )}
                  <Stack gap={0}>
                    <Text fw={counts ? 700 : 500} size="sm">{p.name}</Text>
                    <Group gap={6}>
                      <PlayerStatusBadge p={p} t={t} />
                      {p.toPar !== '-' && (
                        <Text size="xs" c="dimmed">{p.toPar} to par</Text>
                      )}
                    </Group>
                  </Stack>
                </Group>
              </Table.Td>
              {p.roundsDisplay.map((r, i) => (
                <Table.Td key={i} ta="center">
                  <Text size="sm" c={r === '85' ? 'red' : undefined} fw={r === '85' ? 600 : 400}>
                    {r}
                  </Text>
                </Table.Td>
              ))}
              <Table.Td ta="right">
                <Text fw={700} size="sm">{p.total ?? '—'}</Text>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

export function TeamRow({ team, rank, t, leaderTotal }: { team: TeamResult; rank: number; t: Tournament; leaderTotal: number | null }) {
  const rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : '#e9edf2'
  const gap = team.total != null && leaderTotal != null ? team.total - leaderTotal : null

  return (
    <Accordion.Item value={team.owner} style={{ border: 'none', marginBottom: 10 }}>
      <Accordion.Control
        styles={{ control: { borderRadius: 14 }, label: { paddingTop: 10, paddingBottom: 10 } }}
        style={{ borderRadius: 14, background: 'white', boxShadow: '0 1px 3px rgba(10,49,97,0.08)' }}
      >
        <Group justify="space-between" wrap="nowrap" pr="md">
          <Group gap="md" wrap="nowrap">
            <Box
              w={34}
              h={34}
              style={{
                borderRadius: '50%',
                background: rank <= 3 ? rankColor : '#eef2f7',
                color: rank <= 3 ? 'white' : '#0a3161',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {rank}
            </Box>
            <Stack gap={0}>
              <Text fw={700}>{team.owner}</Text>
              <Text size="xs" c="dimmed">
                {team.players.filter((p) => p.status === 'cut' || p.status === 'notfound').length > 0
                  ? `${team.players.filter((p) => p.status === 'cut' || p.status === 'notfound').length} missed cut`
                  : 'Tap for player detail'}
              </Text>
            </Stack>
          </Group>
          <Group gap="lg" wrap="nowrap">
            {gap != null && gap > 0 && (
              <Text size="sm" c="dimmed">+{gap}</Text>
            )}
            <Stack gap={0} align="flex-end">
              <Text fw={800} size="xl" c="#0a3161">{team.total ?? '—'}</Text>
              <Text size="xs" c="dimmed">strokes</Text>
            </Stack>
          </Group>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <PlayerTable team={team} t={t} />
      </Accordion.Panel>
    </Accordion.Item>
  )
}
