'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Bot } from 'lucide-react'
import { onIntroDone } from '@/lib/intro'

// three.js only loads in the browser, after first paint.
const Robot = dynamic(() => import('./Robot'), { ssr: false, loading: () => null })

const BUBBLE_FIRST_MS = 2000
const BUBBLE_VISIBLE_MS = 6000
const BUBBLE_HIDDEN_MS = 9000

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch {
    return false
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export function AssistantBot({ open, onToggle, name }: { open: boolean; onToggle: () => void; name: string }) {
  const [mode, setMode] = useState<'pending' | '3d' | 'fallback'>('pending')
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)
  const [bubble, setBubble] = useState(false)
  const reducedMotion = useReducedMotion()
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const hasOpened = useRef(false)
  const toggleTimer = useRef<number | undefined>(undefined)
  const [introReady, setIntroReady] = useState(false)

  // Don't load three.js or start the bubble until the intro loader has finished.
  useEffect(() => onIntroDone(() => setIntroReady(true)), [])
  useEffect(() => {
    if (introReady) setMode(hasWebGL() ? '3d' : 'fallback')
  }, [introReady])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.clearTimeout(toggleTimer.current)
    }
  }, [])

  // Speech bubble: first at 2s, then every 15s (6s shown, 9s hidden) until the visitor opens the chat once.
  useEffect(() => {
    if (open) hasOpened.current = true
    if (!introReady) return
    if (open || hasOpened.current) {
      setBubble(false)
      return
    }
    const timers: number[] = []
    const cycle = (delay: number) => {
      timers.push(
        window.setTimeout(() => {
          setBubble(true)
          timers.push(
            window.setTimeout(() => {
              setBubble(false)
              cycle(BUBBLE_HIDDEN_MS)
            }, BUBBLE_VISIBLE_MS),
          )
        }, delay),
      )
    }
    cycle(BUBBLE_FIRST_MS)
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      setBubble(false)
    }
  }, [open, introReady])

  const handleClick = () => {
    if (mode !== '3d' || reducedMotion) return onToggle()
    setBounceKey((k) => k + 1)
    window.clearTimeout(toggleTimer.current)
    toggleTimer.current = window.setTimeout(onToggle, 220)
  }

  return (
    <div className="abot-wrap">
      <div className="abot-bubble" data-show={bubble} aria-hidden="true">
        Hi, I&apos;m Yota, {name}&apos;s personal AI assistant! Ask me anything about {name} 👋
      </div>
      {mode === 'fallback' ? (
        <button className="assistant-trigger" onClick={onToggle} aria-expanded={open}>
          <Bot /><span>Ask Yota</span>
        </button>
      ) : (
        <button
          className="abot"
          aria-label={`Open chat with Yota, ${name}'s AI assistant`}
          aria-expanded={open}
          onClick={handleClick}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={(e) => setFocused(e.currentTarget.matches(':focus-visible'))}
          onBlur={() => setFocused(false)}
        >
          {mode === '3d' && (
            <Robot
              pointer={pointer}
              hovered={hovered || focused}
              bounceKey={bounceKey}
              reducedMotion={reducedMotion}
              onContextLost={() => setMode('fallback')}
            />
          )}
        </button>
      )}
    </div>
  )
}
