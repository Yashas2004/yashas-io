'use client'

import { useRef, useState } from 'react'
import { Check, Copy, Send, ShieldCheck } from 'lucide-react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function TerminalContact({ email }: { email: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const statusText =
    status === 'sending' ? 'Sending…'
    : status === 'sent' ? 'Message sent — Yashas will reply to the email you left.'
    : status === 'error' ? `Not sent: ${error.replace(/\.$/, '')} — or email ${email}`
    : ''

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'the mail relay did not respond.')
      setStatus('sent')
      formRef.current?.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'the network request failed.')
      setStatus('error')
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div className="term">
      <div className="term-bar">
        <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="term-title">visitor@yashas.io: ~/contact</span>
        <span className="term-secure"><ShieldCheck aria-hidden="true" /> TLS</span>
      </div>

      <form ref={formRef} className="term-form" onSubmit={onSubmit}>
        {/* honeypot: hidden from people, bots fill it in */}
        <div className="term-hp" aria-hidden="true">
          <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
        </div>

        <label className="term-field">
          <span className="term-prompt"><b>$</b> whoami</span>
          <input name="name" placeholder="Your name" autoComplete="name" required maxLength={100} />
        </label>
        <label className="term-field">
          <span className="term-prompt"><b>$</b> reply-to</span>
          <input type="email" name="email" placeholder="you@company.com" autoComplete="email" required maxLength={200} />
        </label>
        <label className="term-field">
          <span className="term-prompt"><b>$</b> subject</span>
          <input name="subject" placeholder="What’s it about?" required maxLength={150} />
        </label>
        <label className="term-field">
          <span className="term-prompt"><b>$</b> message</span>
          <textarea name="message" placeholder="A role, a project, or just hello…" rows={5} required minLength={10} maxLength={5000} />
        </label>

        {/* Always mounted so screen readers pick up changes; empty (and collapsed) when idle. */}
        <p className={`term-status is-${status}`} role="status" aria-live="polite">{statusText}</p>

        <div className="term-actions">
          <button type="button" className="term-copy" onClick={copyEmail}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Email copied' : email}
          </button>
          <button type="submit" className="term-send" disabled={status === 'sending'}>
            <Send aria-hidden="true" />
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Send another' : 'Send message'}
          </button>
        </div>
      </form>
    </div>
  )
}