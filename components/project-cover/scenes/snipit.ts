import {
  BG, BONE, CYAN, EMBER, MUTED, LINE_STRONG,
  backOut, background, easeInOut, easeOut, glowDot, glowStroke, layoutScale, mono, px, roundRect, sans, seg,
  type Ctx, type Input, type Scene,
} from '../draw'

// Beat 1: long URL types out. Beat 2: a blade cuts it into snip.it/x7Kq. Beat 3: clicks fly in and fill a chart.
const URL = 'https://example.com/blog/2026/how-we-scaled-our-api-to-millions?utm_source=newsletter'
const SHORT = 'snip.it/x7Kq'
const LABELS = ['Chrome', 'iOS', 'IN', 'US', 'Safari', 'Android']
const HEIGHTS = [0.92, 0.58, 0.78, 0.44, 0.66, 0.34]
const CLICK_START = 4.1
const CLICK_GAP = 0.62
const TRAVEL = 0.7
const MAX_EXTRA = 8
// Precomputed typed prefixes and counter labels, so frames don't allocate strings.
const URL_P = Array.from({ length: URL.length + 1 }, (_, i) => URL.slice(0, i))
const COUNTS = Array.from({ length: 20 }, (_, i) => String(i))

type Dot = { ox: number; oy: number; cx: number; cy: number; phone: boolean; color: string }
type Extra = { active: boolean; x: number; y: number; cx: number; cy: number; start: number }

type State = {
  w: number; h: number; sc: number; pad: number
  urlY: number; urlFont: string; urlMax: number; urlFull: number; fade: CanvasGradient
  pillX: number; pillY: number; pillW: number; pillH: number; pillFont: string
  chartX: number; chartY: number; chartW: number; chartH: number; labelFont: string; smallFont: string; countFont: string
  dots: Dot[]; extras: Extra[]
}

const arrival = (i: number) => CLICK_START + i * CLICK_GAP + TRAVEL

function init(w: number, h: number): State {
  const sc = layoutScale(w)
  const pad = Math.round(28 * sc)
  const urlFont = mono(px(15, sc))
  const pillFont = mono(px(22, sc), 600)
  const urlY = Math.round(h * 0.3)
  const chartW = Math.min(w - pad * 2, 520 * sc)
  const chartX = (w - chartW) / 2
  const chartY = h * 0.84
  const chartH = h * 0.3
  const pillY = urlY
  const pillX = w / 2

  // Measure once with an offscreen context.
  const m = document.createElement('canvas').getContext('2d')!
  m.font = urlFont
  const urlFull = m.measureText(URL).width
  m.font = pillFont
  const pillW = m.measureText(SHORT).width + 36 * sc
  const pillH = Math.max(34, 46 * sc)
  const urlMax = w - pad * 2

  const fadeW = Math.min(56, urlMax * 0.25)
  const fade = m.createLinearGradient(pad + urlMax - fadeW, 0, pad + urlMax, 0)
  fade.addColorStop(0, 'rgba(13,12,10,0)')
  fade.addColorStop(1, BG)

  // Click origins around the edges (kept away from the chart), each with a device glyph.
  const inset = Math.max(pad, 24 * sc + 12) // keeps the device glyphs fully inside the card
  const origins: [number, number, boolean][] = [
    [inset, h * 0.14, false], [w - inset, h * 0.5, true], [inset, h * 0.55, true],
    [w - inset, h * 0.14, false], [w * 0.28, Math.max(h * 0.08, inset * 0.8), true], [w * 0.74, h * 0.6, false],
  ]
  const dots = origins.map(([ox, oy, phone], i) => {
    // Control point bends the path sideways for a curved flight.
    const mx = (ox + pillX) / 2
    const my = (oy + pillY) / 2
    const nx = -(pillY - oy)
    const ny = pillX - ox
    const len = Math.hypot(nx, ny) || 1
    const bend = (i % 2 ? 1 : -1) * 0.28 * Math.hypot(pillX - ox, pillY - oy)
    return { ox, oy, cx: mx + (nx / len) * bend, cy: my + (ny / len) * bend, phone, color: i % 2 ? CYAN : EMBER }
  })
  const extras: Extra[] = Array.from({ length: MAX_EXTRA }, () => ({ active: false, x: 0, y: 0, cx: 0, cy: 0, start: 0 }))

  return {
    w, h, sc, pad, urlY, urlFont, urlMax, urlFull, fade, pillX, pillY, pillW, pillH, pillFont,
    chartX, chartY, chartW, chartH, labelFont: sans(px(11, sc), 500), smallFont: sans(px(12, sc), 500), countFont: mono(px(13, sc), 600), dots, extras,
  }
}

function device(ctx: Ctx, x: number, y: number, phone: boolean, color: string, sc: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.4
  if (phone) {
    const pw = 11 * sc + 4
    const ph = 19 * sc + 6
    roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 3)
    ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - 2, y + ph / 2 - 3); ctx.lineTo(x + 2, y + ph / 2 - 3); ctx.stroke()
  } else {
    const lw = 22 * sc + 6
    const lh = 14 * sc + 4
    roundRect(ctx, x - lw / 2, y - lh / 2 - 2, lw, lh, 2)
    ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x - lw / 2 - 4, y + lh / 2 + 1); ctx.lineTo(x + lw / 2 + 4, y + lh / 2 + 1); ctx.stroke()
  }
}

function quad(a: number, c: number, b: number, p: number) {
  const q = 1 - p
  return q * q * a + 2 * q * p * c + p * p * b
}

function draw(ctx: Ctx, s: State, t: number, _dt: number, _input: Input) {
  const { w, h, sc, pad } = s
  background(ctx, w, h)
  const outro = 1 - seg(t, 8.6, 9) // fade everything before the loop restarts

  // ── Beat 1 & 2: the long URL types, then gets cut ──
  if (t < 3.6) {
    const typed = Math.floor(seg(t, 0.2, 2.3) * URL.length)
    const blade = easeInOut(seg(t, 2.5, 3.3))
    const visibleW = Math.min(s.urlFull, s.urlMax)
    const bladeX = pad - 12 + blade * (visibleW + 24)
    ctx.font = s.urlFont
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.save()
    ctx.beginPath()
    ctx.rect(Math.max(pad, bladeX), s.urlY - 30, s.urlMax, 60)
    ctx.clip()
    ctx.globalAlpha = 1 - seg(t, 3.0, 3.5)
    ctx.fillStyle = MUTED
    ctx.fillText(URL_P[typed], pad, s.urlY)
    if (s.urlFull > s.urlMax) { ctx.fillStyle = s.fade; ctx.fillRect(pad + s.urlMax - 56, s.urlY - 20, 56, 40) }
    ctx.restore()
    // caret
    if (t < 2.5 && (t * 2) % 1 < 0.6) {
      const cw = Math.min(ctx.measureText(URL_P[typed]).width, s.urlMax - 4)
      ctx.fillStyle = BONE
      ctx.fillRect(pad + cw + 2, s.urlY - 9 * sc - 2, 2, 18 * sc + 4)
    }
    // blade
    if (t > 2.45 && t < 3.4) {
      ctx.globalAlpha = 1 - seg(t, 3.15, 3.4)
      ctx.beginPath()
      ctx.moveTo(bladeX, s.urlY - 26 * sc - 8)
      ctx.lineTo(bladeX, s.urlY + 26 * sc + 8)
      glowStroke(ctx, EMBER, 2)
      ctx.globalAlpha = 1
    }
  }

  // ── Pulse on every arrival (scheduled + visitor clicks) ──
  let pulse = 0
  let count = 0
  for (let i = 0; i < s.dots.length; i++) {
    const a = arrival(i)
    if (t >= a) { count++; pulse = Math.max(pulse, 1 - seg(t, a, a + 0.45)) }
  }
  for (let i = 0; i < s.extras.length; i++) {
    const e = s.extras[i]
    if (!e.active) continue
    if (t < e.start) { e.active = false; continue } // loop wrapped: reset
    const a = e.start + TRAVEL
    if (t >= a) { count++; pulse = Math.max(pulse, 1 - seg(t, a, a + 0.45)) }
  }

  ctx.globalAlpha = outro

  // ── The short link pill ──
  const pop = backOut(seg(t, 3.1, 3.8))
  if (pop > 0) {
    ctx.save()
    ctx.translate(s.pillX, s.pillY)
    const k = pop * (1 + pulse * 0.06)
    ctx.scale(k, k)
    roundRect(ctx, -s.pillW / 2, -s.pillH / 2, s.pillW, s.pillH, s.pillH / 2)
    ctx.fillStyle = '#17130e'
    ctx.fill()
    glowStroke(ctx, EMBER, 1.5 + pulse * 1.5, 0.7 + pulse)
    ctx.font = s.pillFont
    ctx.fillStyle = BONE
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(SHORT, 0, 1)
    ctx.restore()
  }

  // ── Click counter ──
  if (t > 3.6) {
    ctx.globalAlpha = outro * seg(t, 3.6, 4.1)
    // top centre: "clicks  N"
    ctx.textBaseline = 'middle'
    ctx.font = s.smallFont
    const lw = ctx.measureText('clicks').width
    ctx.font = s.countFont
    const nw = ctx.measureText('00').width
    const cy = Math.max(16, pad * 0.75)
    const left = w / 2 - (lw + 8 + nw) / 2
    ctx.textAlign = 'left'
    ctx.font = s.smallFont
    ctx.fillStyle = MUTED
    ctx.fillText('clicks', left, cy)
    ctx.font = s.countFont
    ctx.fillStyle = BONE
    ctx.fillText(COUNTS[Math.min(count, COUNTS.length - 1)], left + lw + 8, cy)
    ctx.globalAlpha = outro
  }

  // ── Mini bar chart under the pill ──
  if (t > 3.8) {
    const slot = s.chartW / LABELS.length
    const bw = Math.min(28 * sc + 6, slot * 0.46)
    const base = s.chartY
    ctx.globalAlpha = outro * seg(t, 3.8, 4.2) * 0.6
    ctx.strokeStyle = LINE_STRONG
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(s.chartX, base + 0.5); ctx.lineTo(s.chartX + s.chartW, base + 0.5); ctx.stroke()
    ctx.globalAlpha = outro
    ctx.font = s.labelFont
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let i = 0; i < LABELS.length; i++) {
      const a = arrival(i)
      const g = easeOut(seg(t, a, a + 0.45))
      if (g <= 0) continue
      const bx = s.chartX + slot * i + (slot - bw) / 2
      const bh = s.chartH * HEIGHTS[i] * g
      ctx.fillStyle = i % 2 ? CYAN : EMBER
      ctx.globalAlpha = outro * 0.85
      roundRect(ctx, bx, base - bh, bw, bh, Math.min(4, bw / 3))
      ctx.fill()
      ctx.globalAlpha = outro * seg(t, a + 0.1, a + 0.5)
      ctx.fillStyle = MUTED
      ctx.fillText(LABELS[i], bx + bw / 2, base + 6)
    }
    ctx.globalAlpha = outro
  }

  // ── Click dots flying in from devices ──
  for (let i = 0; i < s.dots.length; i++) {
    const d = s.dots[i]
    const start = CLICK_START + i * CLICK_GAP
    if (t < start - 0.35 || t > start + TRAVEL + 0.1) continue
    // device glyph fades in, then out once the dot has left
    ctx.globalAlpha = outro * Math.min(seg(t, start - 0.35, start - 0.05), 1 - seg(t, start + 0.25, start + 0.6)) * 0.9
    device(ctx, d.ox, d.oy, d.phone, d.color, sc)
    const p = seg(t, start, start + TRAVEL)
    if (p > 0 && p < 1) {
      const e = easeInOut(p)
      ctx.globalAlpha = outro
      glowDot(ctx, quad(d.ox, d.cx, s.pillX, e), quad(d.oy, d.cy, s.pillY, e), 3.2, d.color)
    }
  }
  for (let i = 0; i < s.extras.length; i++) {
    const x = s.extras[i]
    if (!x.active) continue
    const p = seg(t, x.start, x.start + TRAVEL)
    if (p >= 1) continue
    const e = easeInOut(p)
    ctx.globalAlpha = outro
    glowDot(ctx, quad(x.x, x.cx, s.pillX, e), quad(x.y, x.cy, s.pillY, e), 3.6, i % 2 ? EMBER : CYAN)
  }
  ctx.globalAlpha = 1
}

function onClick(s: State, x: number, y: number, t: number) {
  let slot = s.extras.find((e) => !e.active)
  if (!slot) slot = s.extras.reduce((a, b) => (a.start < b.start ? a : b))
  slot.active = true
  slot.x = x
  slot.y = y
  slot.start = t
  // gentle curve toward the pill
  slot.cx = (x + s.pillX) / 2 + (y - s.pillY) * 0.25
  slot.cy = (y + s.pillY) / 2 - (x - s.pillX) * 0.25
}

export const snipit: Scene<State> = {
  duration: 9,
  finalTime: 8.4,
  description: 'a long URL is cut down to snip.it/x7Kq, then clicks from laptops and phones fly in and fill a small analytics chart (Chrome, iOS, IN, US).',
  captureClick: true,
  init,
  draw,
  onClick,
}
