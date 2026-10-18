'use client'

import { useEffect, useState } from 'react'
import { markIntroDone } from '@/lib/intro'

const PHRASE = 'Going Live'.split('').map((ch) => (ch === ' ' ? ' ' : ch))
const SEEN_KEY = 'introSeen'
const MIN_MS = 3000
const CAP_MS = 4500
const REDUCED_CAP_MS = 600

/**
 * Full-screen "Going Live" intro. Server-rendered so it covers the very first paint; an inline script in
 * the layout hides it before paint for repeat visits in the same session. Hides once the page has loaded
 * and fonts are ready (min 3s, max 4.5s), then announces `intro:done` so heavy animations can start.
 */
export function IntroLoader({ fontFamily }: { fontFamily: string }) {
  const [phase, setPhase] = useState<'show' | 'hiding' | 'gone'>('show')

  useEffect(() => {
    const root = document.documentElement
    const finish = () => {
      root.classList.remove('intro-active')
      markIntroDone()
    }

    // The inline script's hard cap already fired before hydration: let its fade finish, then unmount.
    if (root.classList.contains('intro-timeout')) {
      markIntroDone()
      const id = window.setTimeout(() => setPhase('gone'), 500)
      return () => window.clearTimeout(id)
    }

    let seen = root.classList.contains('intro-skip')
    try { seen = seen || sessionStorage.getItem(SEEN_KEY) === '1' } catch { /* storage blocked: show it */ }
    if (seen) {
      setPhase('gone')
      finish()
      return
    }

    root.classList.add('intro-active')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const min = reduced ? 0 : MIN_MS
    const cap = reduced ? REDUCED_CAP_MS : CAP_MS
    const fade = reduced ? 200 : 500
    let cancelled = false
    let hidden = false
    const timers: number[] = []

    const hide = () => {
      if (cancelled || hidden) return
      hidden = true
      try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
      setPhase('hiding')
      finish()
      timers.push(window.setTimeout(() => setPhase('gone'), fade))
    }

    // performance.now() counts from navigation start, so both limits are measured from page start.
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve()
      else window.addEventListener('load', () => resolve(), { once: true })
    })
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    Promise.all([loaded, fontsReady]).then(() => {
      timers.push(window.setTimeout(hide, Math.max(0, min - performance.now())))
    })
    timers.push(window.setTimeout(hide, Math.max(0, cap - performance.now())))

    return () => {
      cancelled = true
      timers.forEach((id) => window.clearTimeout(id))
      if (!hidden) root.classList.remove('intro-active')
    }
  }, [])

  if (phase === 'gone') return null

  return (
    <div id="intro-loader" role="status" aria-label="Going live — loading Yashas's portfolio" className={phase === 'hiding' ? 'is-hiding' : undefined}>
      <div className="loader-wrapper" style={{ fontFamily }}>
        {PHRASE.map((ch, i) => (
          <span key={i} className="loader-letter" aria-hidden="true">{ch}</span>
        ))}
        <div className="loader" aria-hidden="true" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}
