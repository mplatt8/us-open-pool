// Shinnecock Hills Golf Club — 2026 U.S. Open setup (par 70, 7,440 yds).
// Source: USGA / AP scorecard for the 2026 U.S. Open.
export const COURSE_NAME = 'Shinnecock Hills'

export interface HoleInfo {
  hole: number
  par: number
  yards: number
}

export const SHINNECOCK: HoleInfo[] = [
  { hole: 1, par: 4, yards: 394 },
  { hole: 2, par: 3, yards: 252 },
  { hole: 3, par: 4, yards: 501 },
  { hole: 4, par: 4, yards: 476 },
  { hole: 5, par: 5, yards: 592 },
  { hole: 6, par: 4, yards: 495 },
  { hole: 7, par: 3, yards: 187 },
  { hole: 8, par: 4, yards: 440 },
  { hole: 9, par: 4, yards: 482 },
  { hole: 10, par: 4, yards: 415 },
  { hole: 11, par: 3, yards: 157 },
  { hole: 12, par: 4, yards: 469 },
  { hole: 13, par: 4, yards: 371 },
  { hole: 14, par: 4, yards: 520 },
  { hole: 15, par: 4, yards: 409 },
  { hole: 16, par: 5, yards: 614 },
  { hole: 17, par: 3, yards: 176 },
  { hole: 18, par: 4, yards: 490 },
]

export const TOTAL_PAR = SHINNECOCK.reduce((a, h) => a + h.par, 0) // 70

export function parFor(hole: number): number {
  return SHINNECOCK[hole - 1]?.par ?? 0
}

export function parSum(lo: number, hi: number): number {
  return SHINNECOCK.filter((h) => h.hole >= lo && h.hole <= hi).reduce((a, h) => a + h.par, 0)
}
