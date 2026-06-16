import { useState } from 'react'
import { Accordion, Badge, Box, Group, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'
import type { Position } from '../lib/scoring'
import type { PlayerScore, TeamResult, Tournament } from '../lib/types'
import { Scorecard } from './Scorecard'

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

const num = { textAlign: 'center', whiteSpace: 'nowrap' } as const

function RoundCell({
  p,
  i,
  open,
  onToggle,
}: {
  p: PlayerScore
  i: number
  open: boolean
  onToggle: () => void
}) {
  const disp = p.roundsDisplay[i]
  const detail = p.roundDetails[i]

  // Missed-cut penalty day — no real round to show.
  if (disp === '85') {
    return (
      <Table.Td style={num}>
        <Text size="sm" c="red" fw={600}>85</Text>
      </Table.Td>
    )
  }

  // Everything else opens a scorecard — the played holes if any, otherwise a
  // blank Shinnecock card with the pars. The cell label is the score if the
  // round is underway, else the tee time, else a dash.
  const label = detail.holes.length > 0 ? disp : detail.teeTime ?? '—'
  const muted = detail.holes.length === 0

  return (
    <Table.Td style={num} p={4}>
      <UnstyledButton
        onClick={onToggle}
        style={{
          padding: '2px 8px',
          borderRadius: 6,
          background: open ? '#0a3161' : 'transparent',
          color: open ? 'white' : muted ? '#868e96' : '#0a3161',
          fontWeight: muted ? 400 : 600,
          fontSize: muted ? 12 : 14,
          borderBottom: open ? 'none' : '1px dotted #adb5bd',
        }}
      >
        {label}
      </UnstyledButton>
    </Table.Td>
  )
}

function PlayerTable({ team, t }: { team: TeamResult; t: Tournament }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  // Show counting players first, then the rest, each in ascending strokes.
  const sorted = [...team.players].sort((a, b) => (a.total ?? Infinity) - (b.total ?? Infinity))

  const openPlayer = openKey ? sorted.find((p) => p.id === openKey.split(':')[0]) : undefined
  const openRoundIdx = openKey ? Number(openKey.split(':')[1]) : null

  return (
    <Stack gap="sm">
      <Table.ScrollContainer minWidth={460} type="native">
        <Table verticalSpacing="xs" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ whiteSpace: 'nowrap' }}>Golfer</Table.Th>
              <Table.Th style={num}>R1</Table.Th>
              <Table.Th style={num}>R2</Table.Th>
              <Table.Th style={num}>R3</Table.Th>
              <Table.Th style={num}>R4</Table.Th>
              <Table.Th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((p) => {
              const counts = team.countingIds.has(p.id)
              const openRound = openKey && openKey.startsWith(`${p.id}:`) ? Number(openKey.split(':')[1]) : null
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
                      {counts ? <IconCheck size={16} color="#228b4c" stroke={3} /> : <Box w={16} />}
                      <Stack gap={0}>
                        <Text fw={counts ? 700 : 500} size="sm" style={{ whiteSpace: 'nowrap' }}>{p.name}</Text>
                        <Group gap={6}>
                          <PlayerStatusBadge p={p} t={t} />
                          {p.toPar !== '-' && <Text size="xs" c="dimmed">{p.toPar} to par</Text>}
                        </Group>
                      </Stack>
                    </Group>
                  </Table.Td>
                  {[0, 1, 2, 3].map((i) => (
                    <RoundCell
                      key={i}
                      p={p}
                      i={i}
                      open={openRound === i}
                      onToggle={() => setOpenKey(openRound === i ? null : `${p.id}:${i}`)}
                    />
                  ))}
                  <Table.Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Text fw={700} size="sm">{p.total ?? '—'}</Text>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Scorecard lives OUTSIDE the player table so it scrolls independently */}
      {openPlayer && openRoundIdx != null && (
        <Box style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 12px' }}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={700} c="dimmed">
              {openPlayer.name} · Round {openRoundIdx + 1} scorecard
            </Text>
            <UnstyledButton onClick={() => setOpenKey(null)}>
              <Text size="xs" c="blue" fw={600}>Close ✕</Text>
            </UnstyledButton>
          </Group>
          <Scorecard holes={openPlayer.roundDetails[openRoundIdx].holes} />
        </Box>
      )}
    </Stack>
  )
}

export function TeamRow({ team, position, t, leaderTotal }: { team: TeamResult; position: Position; t: Tournament; leaderTotal: number | null }) {
  const medal = position.medalRank != null
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
              w={36}
              h={36}
              style={{
                borderRadius: '50%',
                background: medal ? RANK_COLORS[position.medalRank! - 1] : '#eef2f7',
                color: medal ? 'white' : '#0a3161',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: position.label.length > 2 ? 12 : 14,
                flexShrink: 0,
              }}
            >
              {position.label}
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
