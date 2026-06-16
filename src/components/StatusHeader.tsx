import { ActionIcon, Badge, Group, Paper, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { Standings } from '../lib/types'

function roundState(s: Standings): { label: string; color: string } {
  const t = s.tournament
  if (t.state === 'pre') return { label: 'Starts Thu, Jun 18', color: 'gray' }
  if (t.state === 'post') return { label: 'Final', color: 'dark' }
  return { label: `Round ${t.period} • In Progress`, color: 'teal' }
}

export function StatusHeader({ standings, onRefresh }: { standings: Standings; onRefresh: () => void }) {
  const rs = roundState(standings)
  const t = standings.tournament
  const updated = standings.updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })

  return (
    <Paper radius="lg" p="xl" style={{ background: 'linear-gradient(135deg,#0a3161,#143d77)', color: 'white' }} shadow="md">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={2}>
          <Text size="sm" fw={700} style={{ letterSpacing: 2, opacity: 0.85 }}>
            U.S. OPEN POOL · LIVE
          </Text>
          <Title order={1} style={{ lineHeight: 1.05 }}>
            2026 U.S. Open
          </Title>
          <Text size="sm" style={{ opacity: 0.85 }}>
            Shinnecock Hills Golf Club · Southampton, NY
          </Text>
        </Stack>
        <Tooltip label="Refresh now">
          <ActionIcon variant="white" color="dark" radius="xl" size="lg" onClick={onRefresh}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group mt="lg" gap="xs">
        <Badge size="lg" radius="sm" color={rs.color} variant="filled">
          {rs.label}
        </Badge>
        {t.cutLine != null && (
          <Badge size="lg" radius="sm" color="orange" variant="light">
            Cut line: {t.cutLine} (low 60 & ties)
          </Badge>
        )}
        <Badge size="lg" radius="sm" color="gray" variant="light">
          Best 4 of 6 · Missed cut = 85/day
        </Badge>
        <Group gap={6} ml="auto">
          <span style={{ width: 8, height: 8, borderRadius: 8, background: '#37f0a0', boxShadow: '0 0 8px #37f0a0' }} />
          <Text size="xs" style={{ opacity: 0.85 }}>
            Updated {updated} · auto-refresh 60s
          </Text>
        </Group>
      </Group>
    </Paper>
  )
}
