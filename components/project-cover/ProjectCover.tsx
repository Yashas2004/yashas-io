'use client'

import { useEffect, useRef } from 'react'
import { resolveFonts, type Input, type Scene } from './draw'
import { onIntroDone } from '@/lib/intro'
import { snipit } from './scenes/snipit'
import { codevault } from './scenes/codevault'
import { colorize } from './scenes/colorize'
import { mailmind } from './scenes/mailmind'

export type CoverVariant = 'snipit' | 'codevault' | 'colorize' | 'mailmind'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENES: Record<CoverVariant, Scene<any>> = { snipit, codevault, colorize, mailmind }

/**
 * Animated canvas cover for a project card.
 * Time-based loop; pauses off-screen and in hidden tabs; static final frame for reduced motion.
 */
export function ProjectCover({ variant }: { variant: CoverVariant }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scene = SCENES[variant]

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!wrap || !canvas || !ctx) return
    resolveFonts()

    const input: Input = { hover: false, x: 0, y: 0 }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let state: unknown = null
    let w = 0
    let h = 0
    let time = 0
    let last = 0
    let raf = 0
    let visible = false
    let introReady = false

    const render = (dt: number) => {
      if (!state) return
      ctx.save()
      scene.draw(ctx, state, reduced.matches ? scene.finalTime : time % scene.duration, dt, input)
      ctx.restore()
    }

    const frame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      time += dt
      render(dt)
      raf = requestAnimationFrame(frame)
    }

    const shouldRun = () => introReady && visible && !document.hidden && !reduced.matches && w > 0
    const update = () => {
      if (shouldRun()) {
        if (!raf) { last = 0; raf = requestAnimationFrame(frame) }
      } else {
        if (raf) { cancelAnimationFrame(raf); raf = 0 }
        render(0) // keep a correct still frame (e.g. after resize or a reduced-motion switch)
      }
    }

    const resize = () => {
      const box = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.round(box.width)
      h = Math.round(box.height)
      if (!w || !h) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state = scene.init(w, h, dpr)
      update()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() }, { rootMargin: '80px' })
    io.observe(wrap)
    document.addEventListener('visibilitychange', update)
    reduced.addEventListener('change', update)
    // Animation loops wait for the intro loader; a still frame is drawn until then.
    const offIntro = onIntroDone(() => { introReady = true; update() })

    // Pointer tracking only while hovering, and never in reduced motion.
    const toLocal = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      input.x = e.clientX - r.left
      input.y = e.clientY - r.top
    }
    const onMove = (e: PointerEvent) => toLocal(e)
    const onEnter = (e: PointerEvent) => {
      if (reduced.matches) return
      input.hover = true
      toLocal(e)
      canvas.addEventListener('pointermove', onMove)
    }
    const onLeave = () => {
      input.hover = false
      canvas.removeEventListener('pointermove', onMove)
    }
    const onClick = (e: MouseEvent) => {
      if (!scene.captureClick || reduced.matches) return
      e.preventDefault() // this cover reacts to clicks instead of following the card link
      toLocal(e)
      if (state && scene.onClick) scene.onClick(state, input.x, input.y, time % scene.duration)
    }
    canvas.addEventListener('pointerenter', onEnter)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      offIntro()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      reduced.removeEventListener('change', update)
      canvas.removeEventListener('pointerenter', onEnter)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
    }
  }, [scene])

  return (
    <div ref={wrapRef} className={`project-cover project-cover--${variant}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span id={`cover-desc-${variant}`} className="sr-only">Animation: {scene.description}</span>
    </div>
  )
}
