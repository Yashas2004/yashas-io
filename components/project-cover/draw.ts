// Shared palette, easing and drawing helpers for the project cover scenes.

export const BG = '#0d0c0a'
export const EMBER = '#ff9e3d'
export const CYAN = '#5ef0ff'
export const BONE = '#efe9df'
export const MUTED = '#a0968a'
export const FAINT = '#6d655c'
export const GREEN = '#7cbf8a'
export const PANEL = '#15130f'
export const PANEL_2 = '#1c1914'
export const LINE = 'rgba(255, 214, 170, 0.11)'
export const LINE_STRONG = 'rgba(255, 190, 120, 0.28)'

export type Ctx = CanvasRenderingContext2D
export type Input = { hover: boolean; x: number; y: number }

/** A self-contained looping animation. `t` is seconds into the loop; `dt` is the real frame delta (0 when static). */
export interface Scene<S> {
  duration: number
  /** Most explanatory frame, used for prefers-reduced-motion. */
  finalTime: number
  description: string
  /** Clicks on the canvas are handled by the scene instead of following the card link. */
  captureClick?: boolean
  init(w: number, h: number, dpr: number): S
  draw(ctx: Ctx, s: S, t: number, dt: number, input: Input): void
  onClick?(s: S, x: number, y: number, t: number): void
}

// Fonts are resolved once on the client (the page font for UI text, a system mono for code/URLs).
export const fonts = { sans: 'system-ui, sans-serif', mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
export function resolveFonts() {
  const family = getComputedStyle(document.body).fontFamily
  if (family) fonts.sans = family
}

/** Size factor so layouts shrink on small cards; text never goes below 11 CSS px. */
export const layoutScale = (w: number) => Math.min(1, Math.max(0.62, w / 560))
export const px = (size: number, scale: number) => Math.max(11, Math.round(size * scale))
export const sans = (size: number, weight = 500) => `${weight} ${size}px ${fonts.sans}`
export const mono = (size: number, weight = 500) => `${weight} ${size}px ${fonts.mono}`

// ── timing ──
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** Progress 0→1 of `t` within [a, b]. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
export const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
export const backOut = (p: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}
/** Frame-rate independent exponential smoothing. */
export const damp = (from: number, to: number, lambda: number, dt: number) => from + (to - from) * (1 - Math.exp(-lambda * dt))
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p
/** Cheap deterministic hash → [0, 1). */
export const hash = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return v - Math.floor(v)
}

// ── drawing ──
export function background(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(255, 214, 170, 0.035)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 24.5; x < w; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
  for (let y = 24.5; y < h; y += 24) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
  ctx.stroke()
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Glow: a wide low-alpha stroke under a thin bright one, on the current path. */
export function glowStroke(ctx: Ctx, color: string, width: number, glow = 1) {
  ctx.strokeStyle = color
  if (glow > 0) {
    const a = ctx.globalAlpha
    ctx.globalAlpha = a * 0.16 * glow
    ctx.lineWidth = width * 6
    ctx.stroke()
    ctx.globalAlpha = a * 0.28 * glow
    ctx.lineWidth = width * 2.6
    ctx.stroke()
    ctx.globalAlpha = a
  }
  ctx.lineWidth = width
  ctx.stroke()
}

/** Soft glowing dot. */
export function glowDot(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const a = ctx.globalAlpha
  ctx.fillStyle = color
  ctx.globalAlpha = a * 0.14
  ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = a * 0.3
  ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = a
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
}

/** Small rounded label pill. Returns its width. */
export function pill(ctx: Ctx, text: string, x: number, y: number, size: number, opts: { color?: string; border?: string; fill?: string; align?: 'left' | 'right' | 'center'; font?: string } = {}) {
  ctx.font = opts.font ?? sans(size, 500)
  const tw = ctx.measureText(text).width
  const padX = size * 0.75
  const h = size * 1.9
  const w = tw + padX * 2
  const left = opts.align === 'right' ? x - w : opts.align === 'center' ? x - w / 2 : x
  roundRect(ctx, left, y - h / 2, w, h, h / 2)
  ctx.fillStyle = opts.fill ?? 'rgba(13, 12, 10, 0.78)'
  ctx.fill()
  ctx.strokeStyle = opts.border ?? LINE_STRONG
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = opts.color ?? BONE
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(text, left + padX, y + 0.5)
  return w
}
