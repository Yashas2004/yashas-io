import { NextResponse } from 'next/server'

/**
 * POST /api/contact — sends the contact form to your inbox via Resend.
 * Env vars: RESEND_API_KEY (required), CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL (optional)
 */

const TO = process.env.CONTACT_TO_EMAIL || 'yashas.r.2004.07@gmail.com'
const FROM = process.env.CONTACT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>'

const hits = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: 'too many messages from this connection. Try again in a few minutes.' }, { status: 429 })
  }
  hits.set(ip, [...recent, now])

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'the form data could not be read.' }, { status: 400 })
  }

  const field = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '')
  const name = field('name')
  const email = field('email')
  const subject = field('subject')
  const message = field('message')

  if (field('company')) return NextResponse.json({ ok: true }) // honeypot

  if (!name || name.length > 100) return NextResponse.json({ error: 'add your name (up to 100 characters).' }, { status: 400 })
  if (!isEmail(email) || email.length > 200) return NextResponse.json({ error: 'the reply-to email doesn’t look valid.' }, { status: 400 })
  if (!subject || subject.length > 150) return NextResponse.json({ error: 'add a subject (up to 150 characters).' }, { status: 400 })
  if (message.length < 10 || message.length > 5000) return NextResponse.json({ error: 'the message needs 10 to 5000 characters.' }, { status: 400 })

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[contact] RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'the mail relay isn’t configured yet.' }, { status: 503 })
  }

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <p><strong>${escape(name)}</strong> &lt;${escape(email)}&gt; wrote via your portfolio:</p>
      <p style="white-space:pre-wrap;border-left:3px solid #ff9e3d;padding-left:12px">${escape(message)}</p>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `[Portfolio] ${subject}`,
      html,
      text: `${name} <${email}> wrote:\n\n${message}`,
    }),
  })

  if (!res.ok) {
    console.error('[contact] Resend error', res.status, await res.text())
    return NextResponse.json({ error: 'the mail relay rejected the message.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}