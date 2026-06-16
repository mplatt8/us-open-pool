import { Box, Group, Stack, Table, Text } from '@mantine/core'
import type { HoleScore } from '../lib/types'

// golf convention: under par is "red", over par darker; birdies circled, bogeys squared
function holeStyle(rel: number): React.CSSProperties {
  if (rel <= -2) return { background: '#f1c40f', color: '#3b2f00', borderRadius: '50%', fontWeight: 800 } // eagle+
  if (rel === -1) return { background: '#2f9e44', color: 'white', borderRadius: '50%', fontWeight: 700 } // birdie
  if (rel === 1) return { background: '#ffe3e3', color: '#c92a2a', borderRadius: 4, fontWeight: 700 } // bogey
  if (rel >= 2) return { background: '#e03131', color: 'white', borderRadius: 4, fontWeight: 800 } // double+
  return { color: '#495057' } // par
}

function Cell({ children, w = 26 }: { children: React.ReactNode; w?: number }) {
  return (
    <Table.Td p={4} style={{ textAlign: 'center', minWidth: w }}>
      {children}
    </Table.Td>
  )
}

function nineSum(holes: HoleScore[], lo: number, hi: number): number | null {
  const seg = holes.filter((h) => h.hole >= lo && h.hole <= hi)
  return seg.length === hi - lo + 1 ? seg.reduce((a, h) => a + h.strokes, 0) : null
}

function Half({ holes, lo, hi, label }: { holes: HoleScore[]; lo: number; hi: number; label: string }) {
  const cols = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k)
  const byHole = new Map(holes.map((h) => [h.hole, h]))
  const sum = nineSum(holes, lo, hi)
  return (
    <Table withTableBorder withColumnBorders verticalSpacing={2} horizontalSpacing={2} style={{ fontSize: 12 }}>
      <Table.Thead>
        <Table.Tr style={{ background: '#0a3161' }}>
          {cols.map((h) => (
            <Cell key={h}>
              <Text size="xs" fw={700} c="white">{h}</Text>
            </Cell>
          ))}
          <Cell><Text size="xs" fw={800} c="white">{label}</Text></Cell>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          {cols.map((h) => (
            <Cell key={h}>
              <Text size="xs" c="dimmed">{byHole.get(h)?.par ?? ''}</Text>
            </Cell>
          ))}
          <Cell><Text size="xs" c="dimmed">{/* par sum omitted */}</Text></Cell>
        </Table.Tr>
        <Table.Tr>
          {cols.map((h) => {
            const hs = byHole.get(h)
            return (
              <Cell key={h}>
                {hs ? (
                  <Box
                    style={{
                      ...holeStyle(hs.rel),
                      width: 20,
                      height: 20,
                      lineHeight: '20px',
                      margin: '0 auto',
                      fontSize: 12,
                    }}
                  >
                    {hs.strokes}
                  </Box>
                ) : (
                  <Text size="xs" c="dimmed">·</Text>
                )}
              </Cell>
            )
          })}
          <Cell><Text size="xs" fw={800}>{sum ?? ''}</Text></Cell>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )
}

export function Scorecard({ holes }: { holes: HoleScore[] }) {
  if (holes.length === 0) {
    return <Text size="xs" c="dimmed" py="xs">No scorecard yet — this round hasn't started.</Text>
  }
  const total = holes.reduce((a, h) => a + h.strokes, 0)
  return (
    <Stack gap={8} py={6}>
      <Table.ScrollContainer minWidth={300} type="native">
        <Group gap="lg" wrap="nowrap" align="flex-start">
          <Half holes={holes} lo={1} hi={9} label="OUT" />
          <Half holes={holes} lo={10} hi={18} label="IN" />
        </Group>
      </Table.ScrollContainer>
      <Group gap="md">
        <Text size="xs" fw={700}>Round total: {total} ({holes.length} hole{holes.length === 1 ? '' : 's'})</Text>
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
