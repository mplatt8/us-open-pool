import { useEffect, useState } from 'react'
import { Group, Paper, Stack, Text } from '@mantine/core'

// 2026 U.S. Open — Round 1 first tee at Shinnecock Hills (Thu Jun 18, 6:45 AM EDT).
export const TEE_OFF = new Date('2026-06-18T06:45:00-04:00')

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <Stack gap={2} align="center" style={{ minWidth: 64 }}>
      <Text
        fw={800}
        style={{ fontSize: 40, lineHeight: 1, color: 'white', fontVariantNumeric: 'tabular-nums' }}
      >
        {String(value).padStart(2, '0')}
      </Text>
      <Text size="xs" fw={700} style={{ letterSpacing: 1.5, opacity: 0.75, color: 'white' }}>
        {label}
      </Text>
    </Stack>
  )
}

export function Countdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = TEE_OFF.getTime() - now
  if (remaining <= 0) return null // tournament has started — leaderboard takes over

  const { days, hours, minutes, seconds } = parts(remaining)
  return (
    <Paper radius="lg" p="lg" shadow="md" style={{ background: 'linear-gradient(135deg,#143d77,#0a3161)' }}>
      <Stack gap="sm" align="center">
        <Text size="sm" fw={700} style={{ letterSpacing: 2, color: 'white', opacity: 0.85 }}>
          TEES OFF IN
        </Text>
        <Group gap="xl" justify="center">
          <Unit value={days} label="DAYS" />
          <Unit value={hours} label="HOURS" />
          <Unit value={minutes} label="MINUTES" />
          <Unit value={seconds} label="SECONDS" />
        </Group>
        <Text size="xs" style={{ color: 'white', opacity: 0.7 }}>
          Thursday, June 18, 2026 · 6:45 AM ET · Shinnecock Hills
        </Text>
      </Stack>
    </Paper>
  )
}
