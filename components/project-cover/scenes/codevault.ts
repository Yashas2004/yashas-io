import {
  BONE, CYAN, EMBER, GREEN, MUTED, LINE, LINE_STRONG, PANEL,
  backOut, background, damp, easeInOut, glowStroke, layoutScale, lerp, mono, px, roundRect, sans, seg,
  type Ctx, type Input, type Scene,
} from '../draw'

// Beat 1: type "redis cache". Beat 2: full-text search filters the snippet grid.
// Beat 3: "cache HIT · 2ms". Beat 4: 20 test dots go green. Then it all resets.
const QUERY = 'redis cache'
const MATCHES = [1, 5, 6]
const TESTS = 20
const BAR_COLORS = [EMBER, CYAN, BONE, MUTED]
const QUERY_P = Array.from({ length: QUERY.length + 1 }, (_, i) => QUERY.slice(0, i))
const TEST_LABELS = Array.from({ length: TESTS + 1 }, (_, i) => `${i}/${TESTS} tests`)

type Card = { x: number; y: number; w: number; h: number; match: boolean; lines: number[][]; hover: number }

type State = {
  w: number; h: number; sc: number; pad: number
  field: { x: number; y: number; w: number; h: number }
  queryFont: string; badgeFont: string; labelFont: string
  cards: Card[]
  dotsY: number; dotsX: number; dotGap: number; dotR: number
}

function init(w: number, h: number): State {
  const sc = layoutScale(w)
  const pad = Math.round(24 * sc)
  const fieldH = Math.round(30 * sc + 6)
  const field = { x: pad, y: pad, w: Math.min(w * 0.46, 260 * sc + 40), h: fieldH }
  const dotsBand = Math.round(26 * sc + 8)
  const gridTop = field.y + fieldH + Math.round(14 * sc)
  const gridBottom = h - pad - dotsBand
  const gap = Math.round(10 * sc + 2)
  const cw = (w - pad * 2 - gap * 2) / 3
  const ch = (gridBottom - gridTop - gap * 2) / 3

  // Deterministic "code" for each card: lines of [length, colourIndex, length, colourIndex, ...] as fractions of width.
  const cards: Card[] = []
  for (let i = 0; i < 9; i++) {
    const lines: number[][] = []
    const n = 3 + (i % 2)
    for (let l = 0; l < n; l++) {
      const segs: number[] = []
      let used = (l % 3 === 1 ? 0.08 : 0) // indentation
      const parts = 2 + ((i + l) % 3)
      for (let p = 0; p < parts && used < 0.86; p++) {
        const len = 0.12 + (((i * 7 + l * 5 + p * 3) % 9) / 9) * 0.26
        segs.push(Math.min(len, 0.9 - used), (i + l + p) % BAR_COLORS.length)
        used += len + 0.04
      }
      lines.push(segs)
    }
    cards.push({
      x: pad + (i % 3) * (cw + gap),
      y: gridTop + Math.floor(i / 3) * (ch + gap),
      w: cw, h: ch, match: MATCHES.includes(i), lines, hover: 0,
    })
  }

  const dotR = Math.max(2.5, 3.6 * sc)
  const dotGap = Math.min(dotR * 3.4, (w - pad * 2 - 110 * sc) / TESTS)
  return {
    w, h, sc, pad, field,
    queryFont: mono(px(14, sc)), badgeFont: mono(px(12, sc), 600), labelFont: sans(px(12, sc), 500),
    cards,
    dotsY: h - pad - dotsBand / 2 + 4, dotsX: pad + dotR, dotGap, dotR,
  }
}

function drawCard(ctx: Ctx, s: State, c: Card, dim: number, glow: number) {
  const k = lerp(1, 0.94, dim) * (1 + c.hover * 0.015)
  const cx = c.x + c.w / 2
  const cy = c.y + c.h / 2 - c.hover * 3
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(k, k)
  ctx.globalAlpha = lerp(1, 0.25, dim)
  const x = -c.w / 2
  const y = -c.h / 2
  if (c.hover > 0.01) {
    ctx.globalAlpha *= 0.5 * c.hover
    roundRect(ctx, x + 2, y + 6, c.w - 4, c.h, 10)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.globalAlpha = lerp(1, 0.25, dim)
  }
  roundRect(ctx, x, y, c.w, c.h, 10)
  ctx.fillStyle = PANEL
  ctx.fill()
  if (glow > 0) {
    const a = ctx.globalAlpha
    ctx.globalAlpha = a * glow
    glowStroke(ctx, EMBER, 1.4, 0.9)
    ctx.globalAlpha = a
  } else {
    ctx.strokeStyle = c.hover > 0.01 ? LINE_STRONG : LINE
    ctx.lineWidth = 1
    ctx.stroke()
  }
  if (c.hover > 0.01) {
    ctx.globalAlpha *= c.hover * 0.6
    ctx.strokeStyle = BONE
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = lerp(1, 0.25, dim)
  }

  // title bar: three window dots + a filename bar
  const ip = Math.max(8, c.w * 0.08)
  const barH = Math.max(3, 4.5 * s.sc)
  const ty = y + ip + barH / 2
  for (let d = 0; d < 3; d++) {
    ctx.fillStyle = d === 0 ? '#e0614a' : d === 1 ? '#e9b04a' : GREEN
    ctx.globalAlpha *= 0.7
    ctx.beginPath(); ctx.arc(x + ip + d * (barH * 1.8), ty, barH * 0.55, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = lerp(1, 0.25, dim)
  }
  ctx.fillStyle = MUTED
  roundRect(ctx, x + ip + barH * 6, ty - barH / 2, c.w * 0.32, barH, barH / 2)
  ctx.fill()

  // code lines
  const usableW = c.w - ip * 2
  const top = ty + barH + Math.max(6, c.h * 0.1)
  const lineH = Math.max(barH + 4, (c.h - (top - y) - ip) / Math.max(4, c.lines.length))
  for (let l = 0; l < c.lines.length; l++) {
    const segs = c.lines[l]
    let lx = x + ip
    const ly = top + l * lineH
    if (ly + barH > y + c.h - ip * 0.6) break
    for (let p = 0; p < segs.length; p += 2) {
      const lw = segs[p] * usableW
      ctx.fillStyle = BAR_COLORS[segs[p + 1]]
      ctx.globalAlpha = lerp(1, 0.25, dim) * (segs[p + 1] === 2 ? 0.55 : 0.8)
      roundRect(ctx, lx, ly, lw, barH, barH / 2)
      ctx.fill()
      lx += lw + usableW * 0.04
    }
  }
  ctx.restore()
}

function draw(ctx: Ctx, s: State, t: number, dt: number, input: Input) {
  const { w, h, sc, field } = s
  background(ctx, w, h)

  // Loop envelope: everything rewinds during 8.3–9s so frame 9 == frame 0.
  const rewind = easeInOut(seg(t, 8.3, 8.9))
  const typed = Math.round(QUERY.length * seg(t, 0.3, 1.9) * (1 - seg(t, 8.3, 8.7)))
  const filter = easeInOut(seg(t, 2.0, 3.0)) * (1 - rewind)
  const badge = backOut(seg(t, 3.2, 3.75)) * (1 - rewind)
  const flash = seg(t, 3.2, 3.9)
  const tests = seg(t, 4.2, 7.2)
  const done = seg(t, 7.2, 7.6) * (1 - rewind)

  // ── Search field ──
  roundRect(ctx, field.x, field.y, field.w, field.h, field.h / 2)
  ctx.fillStyle = '#0a0908'
  ctx.fill()
  ctx.strokeStyle = typed > 0 ? LINE_STRONG : LINE
  ctx.lineWidth = 1
  ctx.stroke()
  const iconX = field.x + field.h * 0.52
  const iconY = field.y + field.h / 2
  const ir = field.h * 0.17
  ctx.strokeStyle = MUTED
  ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.arc(iconX, iconY - 1, ir, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(iconX + ir * 0.7, iconY + ir * 0.7 - 1); ctx.lineTo(iconX + ir * 1.6, iconY + ir * 1.6 - 1); ctx.stroke()
  ctx.font = s.queryFont
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const textX = iconX + ir * 2.6
  const q = QUERY_P[typed]
  ctx.fillStyle = BONE
  ctx.fillText(q, textX, iconY + 0.5)
  if (t < 8.3 && (t * 2) % 1 < 0.55) {
    ctx.fillRect(textX + ctx.measureText(q).width + 2, iconY - 7 * sc - 1, 1.5, 14 * sc + 2)
  }

  // ── cache HIT badge ──
  if (badge > 0.001) {
    const bx = field.x + field.w + 10 * sc + 4
    ctx.save()
    ctx.translate(bx, iconY)
    ctx.scale(badge, badge)
    ctx.font = s.badgeFont
    const label = 'cache HIT · 2ms'
    const bw = ctx.measureText(label).width + 22 * sc + 10
    const bh = field.h * 0.8
    roundRect(ctx, 0, -bh / 2, bw, bh, bh / 2)
    ctx.fillStyle = 'rgba(94, 240, 255, 0.08)'
    ctx.fill()
    ctx.globalAlpha = 1
    glowStroke(ctx, CYAN, 1.2, 0.8)
    ctx.fillStyle = CYAN
    ctx.fillText(label, (11 * sc + 5), 0.5)
    ctx.restore()
    if (flash > 0 && flash < 1) {
      ctx.globalAlpha = (1 - flash) * 0.7
      ctx.beginPath()
      ctx.arc(bx + 20, iconY, 6 + flash * 40 * sc, 0, Math.PI * 2)
      glowStroke(ctx, CYAN, 1.5, 0.8)
      ctx.globalAlpha = 1
    }
  }

  // ── Snippet cards ──
  for (let i = 0; i < s.cards.length; i++) {
    const c = s.cards[i]
    const over = input.hover && input.x >= c.x && input.x <= c.x + c.w && input.y >= c.y && input.y <= c.y + c.h
    c.hover = dt > 0 ? damp(c.hover, over ? 1 : 0, 12, dt) : over ? 1 : 0
    drawCard(ctx, s, c, c.match ? 0 : filter, c.match ? filter : 0)
  }

  // ── Test dots ──
  for (let i = 0; i < TESTS; i++) {
    const on = tests * TESTS > i + 0.5 ? 1 - rewind : 0
    const x = s.dotsX + i * s.dotGap
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(255, 214, 170, 0.14)'
    ctx.beginPath(); ctx.arc(x, s.dotsY, s.dotR, 0, Math.PI * 2); ctx.fill()
    if (on > 0) {
      ctx.globalAlpha = on
      ctx.fillStyle = GREEN
      ctx.beginPath(); ctx.arc(x, s.dotsY, s.dotR, 0, Math.PI * 2); ctx.fill()
    }
  }
  const passed = Math.min(TESTS, Math.floor(tests * TESTS + 0.5)) * (rewind > 0.5 ? 0 : 1)
  ctx.globalAlpha = 1
  ctx.font = s.labelFont
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  const lx = s.dotsX + TESTS * s.dotGap + 6 * sc
  ctx.fillStyle = done > 0 ? GREEN : MUTED
  ctx.globalAlpha = passed > 0 || done > 0 ? 1 : 0.6
  ctx.fillText(done > 0.5 ? '20/20 tests ✓' : TEST_LABELS[passed], lx, s.dotsY + 0.5)
  ctx.globalAlpha = 1
}

export const codevault: Scene<State> = {
  duration: 9,
  finalTime: 7.8,
  description: 'a search for "redis cache" filters a grid of code snippets down to the matches, a "cache HIT · 2ms" badge appears, and 20 of 20 tests turn green.',
  init,
  draw,
}
