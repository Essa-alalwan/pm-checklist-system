const SCRIBBLE_PATHS = [
  'M8 38 C 18 12, 28 52, 40 30 S 58 8, 70 34 S 92 46, 108 22 S 130 40, 148 28',
  'M6 30 C 20 8, 26 50, 44 26 S 66 44, 82 18 S 104 12, 118 36 S 140 20, 150 32',
  'M10 34 C 24 46, 30 10, 48 32 S 70 50, 86 20 S 108 40, 126 24 S 142 38, 150 26',
]

export function makeSignatureDataUrl(seedIndex: number): string {
  const path = SCRIBBLE_PATHS[seedIndex % SCRIBBLE_PATHS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60">
    <rect width="160" height="60" rx="4" fill="#f7f5ef"/>
    <path d="${path}" fill="none" stroke="#1c2530" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
