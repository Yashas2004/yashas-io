import {
  BONE, CYAN, EMBER, MUTED, LINE_STRONG,
  background, damp, easeInOut, glowStroke, hash, layoutScale, mono, pill, px, roundRect, seg,
  type Ctx, type Input, type Scene,
} from '../draw'

// An app-style "colorize.py" window. The image is a dot-matrix landscape, pre-rendered twice
// (grey "input" and site-palette "GAN output"); a cyan divider sweeps across converting it.

type RGB = [number, number, number]
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mix = (a: RGB, b: RGB, p: number): RGB => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]
const C = {
  skyTop: hex('#5a2e12'), skyLow: hex('#ff9e3d'), sun: hex('#efe9df'), glow: hex('#ff9e3d'),
  hillFar: hex('#5ef0ff'), hillNear: hex('#1f6f78'), tree: hex('#0f3a3f'), lakeTint: hex('#5ef0ff'),
  greyLo: hex('#2a2724'), greyHi: hex('#a0968a'),
}
const HORIZON = 0.62
const SUN = { u: 0.64, v: 0.4, r: 0.11 } // r as a fraction of image height
const HILLS: [number, number, number, number][] = [ // base (v), amplitude, frequency, phase — far → near
  [HORIZON - 0.17, 0.07, 9, 0.4],
  [HORIZON - 0.08, 0.06, 13, 2.1],
  [HORIZON - 0.01, 0.05, 17, 4.2],
]
const TREES = [0.07, 0.12, 0.17, 0.82, 0.88, 0.93]
const EPOCHS = ['epoch 1/3', 'epoch 2/3', 'epoch 3/3']

const hillY = (k: number, u: number) => {
  const [base, amp, f, ph] = HILLS[k]
  return base - amp * (0.6 * Math.sin(u * f + ph) + 0.4 * Math.sin(u * f * 2.3 + ph * 1.7))
}

/** Colour of the scene at (u, v) in image space, plus alpha. `aspect` = width / height of the image. */
function sample(u: number, v: number, aspect: number, depth = 0): [RGB, number] {
  if (v > HORIZON && depth === 0) {
    // Lake: mirror the scene above the horizon, tinted cyan and dimmer.
    const [c] = sample(u, 2 * HORIZON - v, aspect, 1)
    const ripple = 0.85 + 0.15 * Math.sin(v * 140 + u * 9)
    return [mix(c, C.lakeTint, 0.35), 0.62 * ripple]
  }
  // Trees (on the near hill)
  for (const tx of TREES) {
    const th = 0.13 + (tx * 10 % 1) * 0.04
    const top = HORIZON - 0.01 - th
    const halfW = 0.035 * ((v - top) / th) / aspect * 1.6
    if (v > top && v < HORIZON - 0.005 && Math.abs(u - tx) < halfW) return [C.tree, 1]
  }
  // Hills, near → far
  for (let k = HILLS.length - 1; k >= 0; k--) {
    if (v > hillY(k, u)) return [mix(C.hillFar, C.hillNear, (k + 0.2) / HILLS.length), 1]
  }
  // Sky + sun
  const dx = (u - SUN.u) * aspect
  const dy = v - SUN.v
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d < SUN.r) return [C.sun, 1]
  const sky = mix(C.skyTop, C.skyLow, Math.pow(Math.min(1, v / HORIZON), 1.4))
  const glow = Math.max(0, 1 - (d - SUN.r) / (SUN.r * 2.6))
  return [mix(sky, C.glow, glow * 0.55), 1]
}

const css = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`

type State = {
  w: number; h: number; sc: number
  frame: { x: number; y: number; w: number; h: number }
  img: { x: number; y: number; w: number; h: number }
  pitch: number; r: number; cols: number; rows: number
  color: HTMLCanvasElement; grey: HTMLCanvasElement
  dx: number
  titleFont: string; smallFont: string; labelSize: number
  barX: number; barW: number; rowY: number; titleY: number; sepY: number
}

function init(w: number, h: number, dpr: number): State {
  const sc = layoutScale(w)
  const fw = Math.round(w * 0.8)
  const fh = Math.round(h * 0.78)
  const frame = { x: Math.round((w - fw) / 2), y: Math.round((h - fh) / 2), w: fw, h: fh }
  const ip = Math.max(10, Math.round(14 * sc))
  const titleH = Math.max(24, Math.round(30 * sc))
  const rowH = Math.max(18, Math.round(22 * sc))
  const titleY = frame.y + titleH / 2
  const rowY = frame.y + titleH + rowH / 2
  const top = frame.y + titleH + rowH + Math.round(6 * sc)
  const img = { x: frame.x + ip, y: top, w: frame.w - ip * 2, h: frame.y + frame.h - ip - top }

  // Dot grid: ~4.6px pitch on large cards, down to 3.5px on narrow ones.
  const pitch = Math.max(3.5, 4.6 * sc)
  const r = Math.min(2, Math.max(1.3, pitch * 0.33)) // small dots on a wider pitch read as halftone
  const cols = Math.floor(img.w / pitch)
  const rows = Math.floor(img.h / pitch)
  // Centre the grid in the image box.
  img.x += (img.w - cols * pitch) / 2
  img.y += (img.h - rows * pitch) / 2
  img.w = cols * pitch
  img.h = rows * pitch

  // Pre-render both dot images once (per resize); frames only blit + clip.
  const make = () => {
    const cv = document.createElement('canvas')
    cv.width = Math.round(img.w * dpr)
    cv.height = Math.round(img.h * dpr)
    const cx = cv.getContext('2d')!
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { cv, cx }
  }
  const color = make()
  const grey = make()
  const aspect = img.w / img.h
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const u = (col + 0.5) / cols
      const v = (row + 0.5) / rows
      const [c, a] = sample(u, v, aspect)
      const x = (col + 0.5) * pitch
      const y = (row + 0.5) * pitch
      color.cx.fillStyle = css(c, a)
      color.cx.beginPath(); color.cx.arc(x, y, r, 0, Math.PI * 2); color.cx.fill()
      const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
      grey.cx.fillStyle = css(mix(C.greyLo, C.greyHi, Math.pow(lum, 1.15)), a * 0.62) // dim, like inactive elements
      grey.cx.beginPath(); grey.cx.arc(x, y, r, 0, Math.PI * 2); grey.cx.fill()
    }
  }

  const smallSize = px(11, sc)
  const m = document.createElement('canvas').getContext('2d')!
  m.font = mono(smallSize)
  const epochW = m.measureText('epoch 3/3').width
  const barX = frame.x + ip + epochW + 10 * sc + 4
  return {
    w, h, sc, frame, img, pitch, r, cols, rows, color: color.cv, grey: grey.cv,
    dx: img.x + img.w * 0.05,
    titleFont: mono(px(12, sc)), smallFont: mono(smallSize), labelSize: smallSize,
    barX, barW: frame.x + frame.w - ip - barX, rowY, titleY, sepY: frame.y + titleH,
  }
}

/** Divider position (0–1) along the timeline: sweep right, hold, ease back, hold. */
function timelineP(t: number) {
  if (t < 0.5) return 0.05
  if (t < 5.5) return 0.05 + 0.9 * easeInOut(seg(t, 0.5, 5.5))
  if (t < 6.5) return 0.95
  if (t < 9.5) return 0.95 - 0.9 * easeInOut(seg(t, 6.5, 9.5))
  return 0.05
}

function draw(ctx: Ctx, s: State, t: number, dt: number, input: Input) {
  const { w, h, sc, frame: f, img } = s
  background(ctx, w, h)

  // ── App frame ──
  roundRect(ctx, f.x, f.y, f.w, f.h, 12)
  ctx.fillStyle = '#12100d'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 214, 170, 0.12)'
  ctx.lineWidth = 1
  ctx.stroke()
  const ip = img.x - f.x
  // title bar
  const dotR = Math.max(2.5, 3.2 * sc)
  ctx.fillStyle = MUTED
  ctx.globalAlpha = 0.55
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(f.x + ip * 0.9 + dotR + i * dotR * 3, s.titleY, dotR, 0, Math.PI * 2); ctx.fill() }
  ctx.globalAlpha = 1
  ctx.font = s.titleFont
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('colorize.py', f.x + f.w / 2, s.titleY + 0.5)
  ctx.fillStyle = 'rgba(255, 214, 170, 0.08)'
  ctx.fillRect(f.x, s.sepY, f.w, 1)

  // training progress: fills with the sweep, holds full, resets at the loop end
  const progress = easeInOut(seg(t, 0.3, 5.5)) * (1 - seg(t, 9.6, 9.95))
  ctx.font = s.smallFont
  ctx.textAlign = 'left'
  ctx.fillStyle = MUTED
  ctx.fillText(EPOCHS[Math.min(2, Math.floor(progress * 3))], f.x + ip * 0.9, s.rowY + 0.5)
  const barH = Math.max(3, 4 * sc)
  roundRect(ctx, s.barX, s.rowY - barH / 2, s.barW, barH, barH / 2)
  ctx.fillStyle = 'rgba(255, 214, 170, 0.08)'
  ctx.fill()
  if (progress > 0.002) {
    roundRect(ctx, s.barX, s.rowY - barH / 2, s.barW * progress, barH, barH / 2)
    ctx.fillStyle = EMBER
    ctx.fill()
  }

  // ── Dot-matrix image: grey everywhere, colour left of the divider (snapped to dot columns) ──
  const target = input.hover ? Math.min(img.x + img.w, Math.max(img.x, input.x)) : img.x + timelineP(t) * img.w
  s.dx = dt > 0 ? damp(s.dx, target, input.hover ? 10 : 6, dt) : target
  const dx = s.dx
  const col = Math.max(0, Math.min(s.cols, Math.round((dx - img.x) / s.pitch)))
  const splitX = img.x + col * s.pitch
  ctx.drawImage(s.grey, img.x, img.y, img.w, img.h)
  if (col > 0) {
    const srcW = (s.color.width * col) / s.cols
    ctx.drawImage(s.color, 0, 0, srcW, s.color.height, img.x, img.y, col * s.pitch, img.h)
  }

  // dots "converting" right at the divider
  const tick = Math.floor(t * 14)
  for (let row = 0; row < s.rows; row++) {
    const rnd = hash(row, tick)
    if (rnd < 0.82) continue
    ctx.globalAlpha = (rnd - 0.82) / 0.18
    ctx.fillStyle = rnd > 0.93 ? BONE : CYAN
    ctx.beginPath()
    ctx.arc(splitX + s.pitch * 0.5, img.y + (row + 0.5) * s.pitch, s.r * 1.15, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // divider + handle
  ctx.beginPath()
  ctx.moveTo(dx, img.y - 2)
  ctx.lineTo(dx, img.y + img.h + 2)
  glowStroke(ctx, CYAN, 1.3, 0.8)
  const hr = Math.max(8, 9 * sc + 3)
  const hy = img.y + img.h / 2
  ctx.beginPath()
  ctx.arc(dx, hy, hr, 0, Math.PI * 2)
  ctx.fillStyle = '#0d0c0a'
  ctx.fill()
  glowStroke(ctx, EMBER, 1.4, 0.6)
  ctx.fillStyle = BONE
  const a = hr * 0.36
  ctx.beginPath()
  ctx.moveTo(dx - a * 0.4, hy - a); ctx.lineTo(dx - a * 1.4, hy); ctx.lineTo(dx - a * 0.4, hy + a)
  ctx.moveTo(dx + a * 0.4, hy - a); ctx.lineTo(dx + a * 1.4, hy); ctx.lineTo(dx + a * 0.4, hy + a)
  ctx.fill()

  // labels fade with how much of their side is visible
  const ly = img.y + img.h - Math.max(12, 14 * sc)
  const lm = Math.max(6, 8 * sc)
  ctx.globalAlpha = Math.min(1, Math.max(0, (dx - img.x - 30) / (img.w * 0.25)))
  if (ctx.globalAlpha > 0) pill(ctx, 'GAN output', img.x + lm, ly, s.labelSize, { font: s.smallFont, color: CYAN, border: 'rgba(94,240,255,0.5)' })
  ctx.globalAlpha = Math.min(1, Math.max(0, (img.x + img.w - dx - 30) / (img.w * 0.25)))
  if (ctx.globalAlpha > 0) pill(ctx, 'input', img.x + img.w - lm, ly, s.labelSize, { font: s.smallFont, color: MUTED, border: LINE_STRONG, align: 'right' })
  ctx.globalAlpha = 1
}

export const colorize: Scene<State> = {
  duration: 10,
  // On the way back: divider at 50% with the progress bar already full.
  finalTime: 8.0,
  description: 'a colorize.py window converts a greyscale dot-matrix landscape into colour as a divider sweeps across, while a training progress bar fills to epoch 3 of 3.',
  init,
  draw,
}
