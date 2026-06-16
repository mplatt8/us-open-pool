import { Box, Group, Stack, Table, Text } from '@mantine/core'
import { parSum, SHINNECOCK, TOTAL_PAR } from '../lib/course'
import type { HoleScore } from '../lib/types'

// golf convention: birdies circled (green), bogeys squared (red), eagles gold
function scoreStyle(rel: number): React.CSSProperties {
  if (rel <= -2) return { background: '#f1c40f', color: '#3b2f00', borderRadius: '50%', fontWeight: 800 }
  if (rel === -1) return { background: '#2f9e44', color: 'white', borderRadius: '50%', fontWeight: 700 }
  if (rel === 1) return { background: '#ffe3e3', color: '#c92a2a', borderRadius: 4, fontWeight: 700 }
  if (rel >= 2) return { background: '#e03131', color: 'white', borderRadius: 4, fontWeight: 800 }
  return { color: '#495057' }
}

function Cell({ children }: { children: React.ReactNode }) {
  return <Table.Td p={3} style={{ textAlign: 'center', minWidth: 24, whiteSpace: 'nowrap' }}>{children}</Table.Td>
}

function Half({ lo, hi, label, byHole }: { lo: number; hi: number; label: string; byHole: Map<number, HoleScore> }) {
  const holes = SHINNECOCK.filter((h) => h.hole >= lo && h.hole <= hi)
  const played = holes.filter((h) => byHole.has(h.hole))
  const scoreSum = played.reduce((a, h) => a + byHole.get(h.hole)!.strokes, 0)

  return (
    <Table withTableBorder withColumnBorders verticalSpacing={2} horizontalSpacing={2} style={{ fontSize: 12, width: '100%' }}>
      <Table.Thead>
        <Table.Tr style={{ background: '#0a3161' }}>
          <Cell><Text size="xs" fw={700} c="white">Hole</Text></Cell>
          {holes.map((h) => (
            <Cell key={h.hole}><Text size="xs" fw={700} c="white">{h.hole}</Text></Cell>
          ))}
          <Cell><Text size="xs" fw={800} c="white">{label}</Text></Cell>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr style={{ background: '#eef2f7' }}>
          <Cell><Text size="xs" fw={700} c="dimmed">Par</Text></Cell>
          {holes.map((h) => (
            <Cell key={h.hole}><Text size="xs" fw={600} c="dimmed">{h.par}</Text></Cell>
          ))}
          <Cell><Text size="xs" fw={800} c="dimmed">{parSum(lo, hi)}</Text></Cell>
        </Table.Tr>
        <Table.Tr>
          <Cell><Text size="xs" fw={700}>Score</Text></Cell>
          {holes.map((h) => {
            const hs = byHole.get(h.hole)
            return (
              <Cell key={h.hole}>
                {hs ? (
                  <Box style={{ ...scoreStyle(hs.strokes - h.par), width: 20, height: 20, lineHeight: '20px', margin: '0 auto' }}>
                    {hs.strokes}
                  </Box>
                ) : (
                  <Text size="xs" c="dimmed">·</Text>
                )}
              </Cell>
            )
          })}
          <Cell><Text size="xs" fw={800}>{played.length ? scoreSum : ''}</Text></Cell>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )
}

export function Scorecard({ holes }: { holes: HoleScore[] }) {
  const byHole = new Map(holes.map((h) => [h.hole, h]))
  const total = holes.reduce((a, h) => a + h.strokes, 0)

  return (
    <Stack gap={8} py={6}>
      <Table.ScrollContainer minWidth={640} type="native">
        <Group grow gap="md" wrap="nowrap" align="flex-start">
          <Half lo={1} hi={9} label="OUT" byHole={byHole} />
          <Half lo={10} hi={18} label="IN" byHole={byHole} />
        </Group>
      </Table.ScrollContainer>
      <Group gap="md" justify="space-between">
        <Text size="xs" fw={700}>
          {holes.length === 0
            ? `Par ${TOTAL_PAR} · hasn't teed off yet`
            : `Through ${holes.length} hole${holes.length === 1 ? '' : 's'} · ${total} strokes`}
        </Text>
        <Group gap={6}>
          <Box style={{ width: 12, height: 12, borderRadius: '50%', background: '#2f9e44' }} />
          <Text size="xs" c="dimmed">birdie</Text>
          <Box style={{ width: 12, height: 12, borderRadius: 3, background: '#e03131' }} />
          <Text size="xs" c="dimmed">bogey+</Text>
          <Box style={{ width: 12, height: 12, borderRadius: '50%', background: '#f1c40f' }} />
          <Text size="xs" c="dimmed">eagle</Text>
        </Group>
      </Group>
    </Stack>
  )
}
