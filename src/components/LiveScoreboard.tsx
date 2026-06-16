import { Badge, Box, Group, Table, Text } from '@mantine/core'
import type { LeaderboardRow, Tournament } from '../lib/types'

// Distinct colors so each pool owner's golfers are easy to spot on the board.
const OWNER_COLORS: Record<string, string> = {}
const PALETTE = ['#1971c2', '#2f9e44', '#e8590c', '#9c36b5', '#c2255c', '#0c8599', '#5f3dc4', '#a08900']
function ownerColor(owner: string): string {
  if (!(owner in OWNER_COLORS)) {
    OWNER_COLORS[owner] = PALETTE[Object.keys(OWNER_COLORS).length % PALETTE.length]
  }
  return OWNER_COLORS[owner]
}

function parColor(n: number | null): string | undefined {
  if (n == null) return undefined
  if (n < 0) return '#c92a2a' // under par shown in red (golf convention)
  if (n === 0) return undefined
  return '#1b1b1b'
}

const num = { textAlign: 'center', whiteSpace: 'nowrap' } as const

export function LiveScoreboard({ rows, t }: { rows: LeaderboardRow[]; t: Tournament }) {
  return (
    <Table.ScrollContainer minWidth={560} type="native">
      <Table verticalSpacing="xs" horizontalSpacing="sm" stickyHeader highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={num}>Pos</Table.Th>
            <Table.Th style={{ whiteSpace: 'nowrap' }}>Player</Table.Th>
            <Table.Th style={num}>Score</Table.Th>
            <Table.Th style={num}>Today</Table.Th>
            <Table.Th style={num}>Thru</Table.Th>
            <Table.Th style={num}>R1</Table.Th>
            <Table.Th style={num}>R2</Table.Th>
            <Table.Th style={num}>R3</Table.Th>
            <Table.Th style={num}>R4</Table.Th>
            <Table.Th style={num}>Tot</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr key={r.id} style={{ background: r.owner ? `${ownerColor(r.owner)}12` : undefined }}>
              <Table.Td style={num}>
                <Text size="sm" fw={600} c={r.cut ? 'dimmed' : undefined}>{r.position || '—'}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  {r.flag && <img src={r.flag} alt="" width={18} height={13} style={{ borderRadius: 2, flexShrink: 0 }} />}
                  <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>{r.name}</Text>
                  {r.owner && (
                    <Badge size="xs" variant="light" radius="sm"
                      styles={{ root: { background: `${ownerColor(r.owner)}22`, color: ownerColor(r.owner) } }}>
                      {r.owner.split(' ')[0]}
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td style={num}>
                <Text size="sm" fw={700} c={parColor(r.toParNum)}>{r.toPar}</Text>
              </Table.Td>
              <Table.Td style={num}><Text size="sm" c="dimmed">{r.today ?? '—'}</Text></Table.Td>
              <Table.Td style={num}><Text size="sm" c="dimmed">{r.thru}</Text></Table.Td>
              {r.rounds.map((rd, i) => (
                <Table.Td key={i} style={num}><Text size="sm" c="dimmed">{rd ?? '—'}</Text></Table.Td>
              ))}
              <Table.Td style={num}><Text size="sm" fw={600}>{r.totalStrokes ?? '—'}</Text></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {t.state === 'pre' && (
        <Box p="md">
          <Text size="xs" c="dimmed" ta="center">
            Field of {rows.length}. Scores appear once play begins; the "Thru" column shows tee times when posted.
          </Text>
        </Box>
      )}
    </Table.ScrollContainer>
  )
}
