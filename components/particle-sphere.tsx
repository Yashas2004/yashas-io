'use client'

import { useEffect, useRef } from 'react'
import { onIntroDone } from '@/lib/intro'

/**
 * Interactive particle sphere (canvas 2D, no dependencies).
 *  - Slowly rotates; the cursor steers the tilt and spin.
 *  - Particles near the cursor are pushed away and spring back.
 *  - Click / tap sends a shockwave through the sphere.
 *  - Drag (mouse or touch) to spin it by hand.
 *  - Pauses when off-screen; renders a still frame for reduced-motion users.
 */

type Particle = {
  x: number; y: number; z: number
  kind: 0 | 1 | 2 // 0 = shell, 1 = equatorial band, 2 = halo dust
  bucket: number
  seed: number
  ox: number; oy: number
  vx: number; vy: number
  sx: number; sy: number
}

const PALETTE = ['#fff4dc', '#ffe0a3', '#ffc66b', '#ffa94a', '#ff8a3a', '#f0662c']

function gaussian() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function buildParticles(count: number): Particle[] {
  const out: Particle[] = []
  const shell = Math.floor(count * 0.62)
  const band = Math.floor(count * 0.28)
  const halo = count - shell - band
  const golden = Math.PI * (3 - Math.sqrt(5))

  const colourFor = (x: number) => {
    const t = Math.min(0.999, Math.max(0, (x + 1) / 2 + gaussian() * 0.18))
    return Math.floor(t * PALETTE.length)
  }

  for (let i = 0; i < shell; i++) {
    const y = 1 - (i / (shell - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const th = golden * i
    const jitter = 1 + gaussian() * 0.008
    const x = Math.cos(th) * r * jitter
    const z = Math.sin(th) * r * jitter
    out.push({ x, y: y * jitter, z, kind: 0, bucket: colourFor(x), seed: Math.random() * 6.28, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0 })
  }
  for (let i = 0; i < band; i++) {
    const th = Math.random() * Math.PI * 2
    const rad = 0.25 + Math.sqrt(Math.random()) * 0.72
    const x = Math.cos(th) * rad
    const z = Math.sin(th) * rad
    const y = gaussian() * 0.055 + Math.sin(th * 2) * 0.03
    out.push({ x, y, z, kind: 1, bucket: colourFor(x), seed: Math.random() * 6.28, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0 })
  }
  for (let i = 0; i < halo; i++) {
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const rad = 1.08 + Math.pow(Math.random(), 1.8) * 0.55
    const r = Math.sqrt(1 - u * u)
    out.push({ x: Math.cos(th) * r * rad, y: u * rad, z: Math.sin(th) * r * rad, kind: 2, bucket: colourFor(Math.cos(th)), seed: Math.random() * 6.28, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0 })
  }
  return out
}

export function ParticleSphere({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 720px)').matches
    const particles = buildParticles(small ? 3200 : 6500)

    let width = 0, height = 0, radius = 0, cx = 0, cy = 0
    let raf = 0, running = false, visible = true

    const pointer = { x: -9999, y: -9999, nx: 0, ny: 0 }
    let spin = 0, spinVel = 0.0022, tilt = -0.32, tiltTarget = -0.32
    let dragging = false, lastDragX = 0, lastDragY = 0
    let pulse = 0
    const light = { x: -0.55, y: -0.6, z: -0.58 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      radius = Math.min(width, height) * 0.36
      cx = width / 2
      cy = height / 2
    }

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const onMove = (e: PointerEvent) => {
      const p = toLocal(e.clientX, e.clientY)
      pointer.x = p.x
      pointer.y = p.y
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1
      if (dragging) {
        spinVel = (e.clientX - lastDragX) * 0.0009
        tiltTarget = Math.max(-1.1, Math.min(1.1, tiltTarget + (e.clientY - lastDragY) * 0.004))
        lastDragX = e.clientX
        lastDragY = e.clientY
      }
    }
    const onLeave = () => { pointer.x = pointer.y = -9999 }
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e.clientX, e.clientY)
      if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) return
      dragging = true
      lastDragX = e.clientX
      lastDragY = e.clientY
      pulse = 1
      for (const pt of particles) {
        const dx = pt.sx - p.x, dy = pt.sy - p.y
        const d = Math.hypot(dx, dy) || 1
        const f = Math.max(0, 1 - d / (radius * 1.4)) * 14
        pt.vx += (dx / d) * f
        pt.vy += (dy / d) * f
      }
      if (reduceMotion) draw(true)
    }
    const onUp = () => { dragging = false }

    const draw = (staticFrame = false) => {
      ctx.clearRect(0, 0, width, height)

      if (!staticFrame) {
        if (!dragging) {
          spinVel += (0.0022 + pointer.nx * 0.0035 - spinVel) * 0.03
          tiltTarget += (-0.32 + pointer.ny * 0.35 - tiltTarget) * 0.04
        }
        spin += spinVel
        tilt += (tiltTarget - tilt) * 0.08
        pulse *= 0.94
      }

      const cosY = Math.cos(spin), sinY = Math.sin(spin)
      const cosX = Math.cos(tilt), sinX = Math.sin(tilt)
      const fov = 3.2
      const R = radius * (1 + pulse * 0.07)
      const repelR = Math.min(width, height) * 0.16
      const time = performance.now() * 0.001

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25)
      glow.addColorStop(0, 'rgba(255, 170, 80, 0.10)')
      glow.addColorStop(0.55, 'rgba(255, 140, 60, 0.035)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      const buckets: number[][] = PALETTE.map(() => [])

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        let bx = p.x, bz = p.z
        if (p.kind === 2) {
          const a = time * 0.04 + p.seed
          bx = p.x * Math.cos(a * 0.2) - p.z * Math.sin(a * 0.2)
          bz = p.x * Math.sin(a * 0.2) + p.z * Math.cos(a * 0.2)
        }
        const x1 = bx * cosY - bz * sinY
        const z1 = bx * sinY + bz * cosY
        const y2 = p.y * cosX - z1 * sinX
        const z2 = p.y * sinX + z1 * cosX
        const scale = fov / (fov + z2)
        let sx = cx + x1 * R * scale
        let sy = cy + y2 * R * scale

        if (!staticFrame) {
          const dx = sx + p.ox - pointer.x
          const dy = sy + p.oy - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < repelR * repelR) {
            const d = Math.sqrt(d2) || 1
            const f = (1 - d / repelR) * 1.6
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
          p.vx += -p.ox * 0.045
          p.vy += -p.oy * 0.045
          p.vx *= 0.86
          p.vy *= 0.86
          p.ox += p.vx
          p.oy += p.vy
        }
        sx += p.ox
        sy += p.oy
        p.sx = sx
        p.sy = sy

        const len = Math.hypot(x1, y2, z2) || 1
        const nx = x1 / len, ny = y2 / len, nz = z2 / len
        const lambert = Math.max(0, -(nx * light.x + ny * light.y + nz * light.z))
        const rim = Math.pow(1 - Math.abs(nz), 3)
        const depth = (1 - z2) / 2
        let alpha: number
        if (p.kind === 0) alpha = 0.2 + lambert * 0.75 + rim * 0.75 * (0.4 + depth)
        else if (p.kind === 1) alpha = 0.32 + depth * 0.65
        else alpha = 0.1 + depth * 0.28
        alpha *= 0.75 + 0.25 * Math.sin(time * 1.6 + p.seed)
        if (alpha < 0.03) continue

        const size = (p.kind === 2 ? 1.1 : 1.7) * scale * (0.85 + depth * 0.5)
        buckets[p.bucket].push(sx, sy, size, Math.min(1, alpha))
      }

      for (let b = 0; b < buckets.length; b++) {
        const arr = buckets[b]
        ctx.fillStyle = PALETTE[b]
        for (let k = 0; k < arr.length; k += 4) {
          ctx.globalAlpha = arr[k + 3]
          const s = arr[k + 2]
          ctx.fillRect(arr[k] - s / 2, arr[k + 1] - s / 2, s, s)
        }
      }
      ctx.globalAlpha = 1
    }

    const loop = () => {
      if (!running) return
      draw()
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || !introReady || reduceMotion || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    // Hold the animation loop until the intro loader has finished (a still frame is drawn meanwhile).
    let introReady = false
    const offIntro = onIntroDone(() => { introReady = true; start() })

    resize()
    draw(true)

    const ro = new ResizeObserver(() => { resize(); if (!running) draw(true) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : start())

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      offIntro()
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`particle-sphere ${className}`}
      aria-label="Interactive particle sphere. Move your cursor to steer it, click to send a pulse."
      role="img"
    />
  )
}