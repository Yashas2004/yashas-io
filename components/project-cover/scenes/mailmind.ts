import {
  BONE, CYAN, EMBER, GREEN, MUTED, FAINT, LINE, LINE_STRONG, PANEL,
  backOut, background, damp, easeInOut, easeOut, glowDot, glowStroke, layoutScale, lerp, pill, px, roundRect, sans, seg,
  type Ctx, type Input, type Scene,
} from '../draw'

// ReAct loop: the Agent calls each of 6 tools in turn; every call fills in part of the email on the right.
const TOOLS = ['Recipient', 'Subject', 'Tone', 'Draft', 'Refine', 'Save']
const TO = 'hiring@company.com'
const SUBJECT = 'Following up on our chat'
const BODY = [0.92, 0.84, 0.88, 0.56] // body line lengths
const REFINED = 0.6 // line 2 after "Refine"
const BEAT0 = 0.6
const BEAT = 1.3
const beat = (i: number) => BEAT0 + i * BEAT

// Typed prefixes, precomputed so the frame loop doesn't allocate strings.
const prefixes = (s: string) => Array.from({ length: s.length + 1 }, (_, i) => s.slice(0, i))
const TO_P = prefixes(TO)
const SUBJECT_P = prefixes(SUBJECT)

type Node = { x: number; y: number; labelY: number; hover: number }

type State = {
  w: number; h: number; sc: number; pad: number
  gx: number; gy: number; agentR: number; nodeR: number; nodes: Node[]
  card: { x: number; y: number; w: number; h: number }
  labelFont: string; agentFont: string; fieldFont: string; smallFont: string; size: number
  /** Fades long field values into the card's right edge on narrow cards. */
  fieldFade: CanvasGradient; fadeW: number
}

function init(w: number, h: number): State {
  const sc = layoutScale(w)
  const pad = Math.round(20 * sc + 4)
  const graphW = w * 0.55
  const gx = graphW / 2 + pad * 0.3
  const gy = h * 0.52
  const R = Math.min(graphW * 0.36, h * 0.33)
  const nodeR = w < 420 ? 6 : 7 * sc + 3
  const agentR = 22 * sc + 6
  const lblGap = nodeR + px(11, sc) * 0.9 + 2
  const nodes: Node[] = TOOLS.map((_, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / 3
    const x = gx + Math.cos(ang) * R
    const y = gy + Math.sin(ang) * R
    return { x, y, labelY: Math.sin(ang) < 0 ? y - lblGap : y + lblGap, hover: 0 }
  })
  const cx = w * 0.56
  const card = { x: cx, y: pad, w: w - cx - pad * 0.8, h: h - pad * 2 }
  const fadeW = Math.min(36, card.w * 0.25)
  const fieldFade = document.createElement('canvas').getContext('2d')!.createLinearGradient(card.x + card.w - fadeW - 2, 0, card.x + card.w - 2, 0)
  fieldFade.addColorStop(0, 'rgba(21,19,15,0)')
  fieldFade.addColorStop(1, PANEL)
  return {
    fieldFade, fadeW,
    w, h, sc, pad, gx, gy, agentR, nodeR, nodes,
    card,
    labelFont: sans(px(12, sc), 500), agentFont: sans(px(12, sc), 600), fieldFont: sans(px(13, sc), 500),
    smallFont: sans(px(11, sc), 500), size: px(11, sc),
  }
}

function draw(ctx: Ctx, s: State, t: number, dt: number, input: Input) {
  const { w, h, sc } = s
  background(ctx, w, h)
  const outro = 1 - seg(t, 9.4, 9.95)

  // Which tool is hovered?
  let hovered = -1
  if (input.hover) {
    for (let i = 0; i < s.nodes.length; i++) {
      const n = s.nodes[i]
      if (Math.hypot(input.x - n.x, input.y - n.y) < s.nodeR + 14) hovered = i
    }
  }

  // ── Edges ──
  for (let i = 0; i < s.nodes.length; i++) {
    const n = s.nodes[i]
    n.hover = dt > 0 ? damp(n.hover, i === hovered ? 1 : 0, 12, dt) : i === hovered ? 1 : 0
    const b = beat(i)
    const active = seg(t, b, b + 0.1) * (1 - seg(t, b + 0.9, b + 1.1))
    ctx.beginPath()
    ctx.moveTo(s.gx, s.gy)
    ctx.lineTo(n.x, n.y)
    if (n.hover > 0.02 || active > 0.02) {
      ctx.globalAlpha = Math.max(n.hover, active * 0.8)
      glowStroke(ctx, n.hover > active ? BONE : CYAN, 1.2, 0.7)
      ctx.globalAlpha = 1
    } else {
      ctx.strokeStyle = LINE_STRONG
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // ── Pulse travelling Agent → tool → Agent ──
  for (let i = 0; i < s.nodes.length; i++) {
    const b = beat(i)
    if (t < b || t > b + 0.9) continue
    const out = t < b + 0.45
    const p = easeInOut(out ? seg(t, b, b + 0.45) : 1 - seg(t, b + 0.45, b + 0.9))
    const n = s.nodes[i]
    glowDot(ctx, lerp(s.gx, n.x, p), lerp(s.gy, n.y, p), 3.4, CYAN)
  }

  // ── Agent node ──
  ctx.beginPath()
  ctx.arc(s.gx, s.gy, s.agentR, 0, Math.PI * 2)
  ctx.fillStyle = PANEL
  ctx.fill()
  const thinking = t > BEAT0 && t < beat(5) + 1 ? 0.6 + 0.4 * Math.sin(t * 6) : 0.6
  ctx.globalAlpha = thinking
  glowStroke(ctx, CYAN, 1.8, 0.9)
  ctx.globalAlpha = 1
  ctx.font = s.agentFont
  ctx.fillStyle = BONE
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Agent', s.gx, s.gy + 0.5)

  // ── Tool nodes ──
  ctx.font = s.labelFont
  for (let i = 0; i < s.nodes.length; i++) {
    const n = s.nodes[i]
    const b = beat(i)
    const fired = seg(t, b + 0.4, b + 0.5)
    const lit = fired * lerp(1, 0.45, seg(t, b + 0.9, b + 1.5)) * outro
    ctx.beginPath()
    ctx.arc(n.x, n.y, s.nodeR, 0, Math.PI * 2)
    ctx.fillStyle = PANEL
    ctx.fill()
    ctx.strokeStyle = LINE_STRONG
    ctx.lineWidth = 1
    ctx.stroke()
    if (lit > 0.01) {
      ctx.globalAlpha = lit
      glowDot(ctx, n.x, n.y, s.nodeR * 0.75, EMBER)
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = n.hover > 0.5 ? BONE : lit > 0.3 ? EMBER : MUTED
    if (n.hover > 0.02) {
      ctx.globalAlpha = 0.25 * n.hover
      ctx.fillText(TOOLS[i], n.x, n.labelY + 1)
      ctx.globalAlpha = 1
    }
    ctx.fillText(TOOLS[i], n.x, n.labelY)
  }

  // ── Email compose card ──
  const c = s.card
  ctx.globalAlpha = 1
  roundRect(ctx, c.x, c.y, c.w, c.h, 12)
  ctx.fillStyle = PANEL
  ctx.fill()
  ctx.strokeStyle = LINE_STRONG
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.save()
  roundRect(ctx, c.x, c.y, c.w, c.h, 12)
  ctx.clip()
  ctx.globalAlpha = outro
  const ip = Math.max(10, 14 * sc)
  const rowH = Math.max(24, 30 * sc)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  // window title
  ctx.font = s.smallFont
  ctx.fillStyle = FAINT
  ctx.fillText('New message', c.x + ip, c.y + rowH * 0.55)
  let y = c.y + rowH * 1.1
  const rule = (yy: number) => { ctx.fillStyle = LINE; ctx.fillRect(c.x + ip, yy, c.w - ip * 2, 1) }
  rule(y)
  // To:
  y += rowH * 0.55
  ctx.font = s.fieldFont
  ctx.fillStyle = MUTED
  ctx.fillText('To:', c.x + ip, y)
  const labelW = ctx.measureText('Subject: ').width
  const toN = Math.round(TO.length * seg(t, beat(0) + 0.45, beat(0) + 1.15))
  ctx.fillStyle = BONE
  ctx.fillText(TO_P[toN], c.x + ip + ctx.measureText('To: ').width, y)
  y += rowH * 0.55
  rule(y)
  // Subject:
  y += rowH * 0.55
  ctx.fillStyle = MUTED
  ctx.fillText('Subject:', c.x + ip, y)
  const subN = Math.round(SUBJECT.length * seg(t, beat(1) + 0.45, beat(1) + 1.2))
  ctx.fillStyle = BONE
  ctx.fillText(SUBJECT_P[subN], c.x + ip + labelW, y)
  // soft fade where long values meet the card edge (To + Subject rows)
  ctx.fillStyle = s.fieldFade
  ctx.fillRect(c.x + c.w - s.fadeW - 2, y - rowH * 1.4, s.fadeW, rowH * 1.7)
  y += rowH * 0.55
  rule(y)
  // tone chip
  y += rowH * 0.6
  const chip = backOut(seg(t, beat(2) + 0.45, beat(2) + 0.85))
  if (chip > 0.01) {
    ctx.save()
    ctx.translate(c.x + ip, y)
    ctx.scale(chip, chip)
    pill(ctx, 'tone: friendly', 0, 0, s.size, { color: CYAN, border: 'rgba(94,240,255,0.45)', fill: 'rgba(94,240,255,0.06)' })
    ctx.restore()
  }
  // body bars
  y += rowH * 0.7
  const bodyW = c.w - ip * 2
  const barH = Math.max(4, 6 * sc)
  const gap = Math.max(10, 14 * sc)
  for (let i = 0; i < BODY.length; i++) {
    const by = y + i * gap
    if (by > c.y + c.h - rowH * 1.2) break
    const grow = easeOut(seg(t, beat(3) + 0.45 + i * 0.15, beat(3) + 0.85 + i * 0.15))
    let len = BODY[i] * grow
    let strike = 0
    if (i === 1) {
      // Refine: strike through, collapse, retype shorter
      const r = beat(4)
      strike = seg(t, r + 0.45, r + 0.7) * (1 - seg(t, r + 0.75, r + 0.8))
      const collapse = seg(t, r + 0.75, r + 0.95)
      const regrow = easeOut(seg(t, r + 0.95, r + 1.25))
      if (t >= r + 0.75) len = collapse < 1 ? BODY[i] * (1 - collapse) : REFINED * regrow
    }
    if (len <= 0.001) continue
    ctx.fillStyle = i === 1 && t >= beat(4) + 0.95 ? EMBER : 'rgba(239,233,223,0.55)'
    roundRect(ctx, c.x + ip, by, bodyW * len, barH, barH / 2)
    ctx.fill()
    if (strike > 0) {
      ctx.fillStyle = EMBER
      ctx.fillRect(c.x + ip - 2, by + barH / 2 - 0.75, (bodyW * len + 4) * strike, 1.5)
    }
  }
  // Saved badge
  const saved = backOut(seg(t, beat(5) + 0.45, beat(5) + 0.85))
  if (saved > 0.01) {
    ctx.save()
    ctx.translate(c.x + c.w - ip, c.y + c.h - rowH * 0.6)
    ctx.scale(saved, saved)
    pill(ctx, 'Saved ✓', 0, 0, s.size, { align: 'right', color: GREEN, border: 'rgba(124,191,138,0.5)', fill: 'rgba(124,191,138,0.08)' })
    ctx.restore()
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

export const mailmind: Scene<State> = {
  duration: 10,
  finalTime: 9.2,
  description: 'an AI agent calls six tools in turn (Recipient, Subject, Tone, Draft, Refine, Save), and each call fills in part of an email until it is saved.',
  init,
  draw,
}
