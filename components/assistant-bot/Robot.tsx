'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Glossy robot mascot built from primitives (no model files, no HDR downloads).
 * Loaded client-side only via next/dynamic from AssistantBot.
 */

export type RobotProps = {
  pointer: RefObject<{ x: number; y: number } | null>
  hovered: boolean
  bounceKey: number
  reducedMotion: boolean
  onContextLost: () => void
}

const CYAN = '#5ef0ff'
const CHEST = '#8fd8ff'
const { damp, clamp } = THREE.MathUtils

// Torus arc rotated so the arc is centred on `centre` (radians, 0 = +x).
function Arc({ radius, tube, arc, centre, ...props }: { radius: number; tube: number; arc: number; centre: number } & ThreeElements['mesh']) {
  return (
    <mesh rotation={[0, 0, centre - arc / 2]} {...props}>
      <torusGeometry args={[radius, tube, 8, 24, arc]} />
      <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.2} toneMapped={false} />
    </mesh>
  )
}

function RobotModel({ pointer, hovered, bounceKey, reducedMotion }: Omit<RobotProps, 'onContextLost'>) {
  const live = useRef({ hovered, reducedMotion })
  live.current = { hovered, reducedMotion }

  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const happyEyes = useRef<THREE.Group>(null)
  const leftHand = useRef<THREE.Mesh>(null)
  const rightHand = useRef<THREE.Mesh>(null)
  const anim = useRef({ nextBlink: 2 + Math.random() * 3, blinkAt: -1, nextTilt: 6, tiltUntil: 0, tiltDir: 1, bounceAt: -1, pendingBounce: false })
  const gl = useThree((s) => s.gl)

  const shell = useRef(
    new THREE.MeshPhysicalMaterial({ color: '#f4f6fa', roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.2 }),
  ).current

  useEffect(() => {
    if (bounceKey > 0) anim.current.pendingBounce = true
  }, [bounceKey])

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1)
    const t = state.clock.elapsedTime
    const a = anim.current
    const { hovered: isHover, reducedMotion: still } = live.current
    if (!root.current || !head.current || !body.current || !eyes.current || !happyEyes.current || !leftHand.current || !rightHand.current) return

    // ── Look at the cursor (anywhere on the page) ──
    let yaw = 0
    let pitch = 0
    const p = pointer.current
    if (p) {
      const rect = gl.domElement.getBoundingClientRect()
      const dx = (p.x - (rect.left + rect.width / 2)) / 600
      const dy = (p.y - (rect.top + rect.height * 0.35)) / 600
      yaw = clamp(Math.atan(dx), -0.55, 0.55)
      pitch = clamp(Math.atan(dy), -0.3, 0.3)
    }
    head.current.rotation.y = damp(head.current.rotation.y, yaw, 6, dt)
    head.current.rotation.x = damp(head.current.rotation.x, pitch, 6, dt)
    eyes.current.position.x = damp(eyes.current.position.x, yaw * 0.08, 8, dt)
    eyes.current.position.y = damp(eyes.current.position.y, -pitch * 0.08, 8, dt)
    happyEyes.current.position.copy(eyes.current.position)
    body.current.rotation.y = damp(body.current.rotation.y, yaw * 0.25, 4, dt)
    body.current.rotation.x = damp(body.current.rotation.x, pitch * 0.12, 4, dt)
    body.current.rotation.z = damp(body.current.rotation.z, -yaw * 0.08, 4, dt)

    // ── Blink (also with reduced motion) ──
    if (t > a.nextBlink) {
      a.blinkAt = t
      a.nextBlink = t + 3 + Math.random() * 3
    }
    const bp = (t - a.blinkAt) / 0.14
    eyes.current.scale.y = bp >= 0 && bp < 1 ? 1 - 0.9 * Math.sin(bp * Math.PI) : 1
    eyes.current.visible = !isHover
    happyEyes.current.visible = isHover

    // ── Occasional head tilt ──
    if (!still && t > a.nextTilt) {
      a.tiltDir = Math.random() < 0.5 ? -1 : 1
      a.tiltUntil = t + 1.2
      a.nextTilt = t + 6 + Math.random() * 4
    }
    const tilt = !still && t < a.tiltUntil ? 0.12 * a.tiltDir : 0
    head.current.rotation.z = damp(head.current.rotation.z, tilt - yaw * 0.05, 4, dt)

    // ── Bob, bounce ──
    if (a.pendingBounce) {
      a.pendingBounce = false
      if (!still) a.bounceAt = t
    }
    const bounceP = (t - a.bounceAt) / 0.5
    const bounce = a.bounceAt >= 0 && bounceP < 1 ? Math.sin(bounceP * Math.PI) : 0
    const bob = still ? 0 : Math.sin(t * 1.6) * 0.06
    root.current.position.y = bob + bounce * 0.18
    root.current.scale.set(0.78 * (1 - bounce * 0.03), 0.78 * (1 + bounce * 0.06), 0.78)

    // ── Floating hands, wave on hover ──
    const handBob = still ? 0 : Math.sin(t * 1.6 + 1.2) * 0.08
    leftHand.current.position.y = -0.45 + handBob
    const waving = isHover && !still
    rightHand.current.position.y = damp(rightHand.current.position.y, -0.45 + handBob + (waving ? 0.4 : 0), 8, dt)
    rightHand.current.position.x = damp(rightHand.current.position.x, 0.82 + (waving ? Math.sin(t * 12) * 0.09 : 0), 14, dt)
  })

  return (
    <group ref={root} scale={0.78}>
      {/* Head */}
      <group ref={head} position={[0, 0.35, 0]}>
        <RoundedBox args={[1.15, 0.9, 0.85]} radius={0.28} smoothness={4} material={shell} />
        {/* Face screen */}
        <RoundedBox args={[0.86, 0.6, 0.1]} radius={0.045} smoothness={3} position={[0, -0.01, 0.4]}>
          <meshPhysicalMaterial color="#05070a" roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} />
        </RoundedBox>
        <group ref={eyes}>
          {[-0.18, 0.18].map((x) => (
            <RoundedBox key={x} args={[0.13, 0.19, 0.04]} radius={0.018} smoothness={2} position={[x, 0.05, 0.46]}>
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.2} toneMapped={false} />
            </RoundedBox>
          ))}
        </group>
        <group ref={happyEyes} visible={false}>
          {[-0.18, 0.18].map((x) => (
            <Arc key={x} radius={0.07} tube={0.022} arc={Math.PI * 0.75} centre={Math.PI / 2} position={[x, 0.02, 0.46]} />
          ))}
        </group>
        <Arc radius={0.09} tube={0.018} arc={Math.PI * 0.8} centre={-Math.PI / 2} position={[0, -0.1, 0.455]} />
        {/* Ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={shell}>
            <cylinderGeometry args={[0.14, 0.14, 0.08, 24]} />
          </mesh>
        ))}
        {/* Antenna */}
        <mesh position={[0, 0.55, 0]} material={shell}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>

      {/* Body */}
      <group ref={body} position={[0, -0.55, 0]}>
        <mesh scale={[0.55, 0.62, 0.5]} material={shell}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <RoundedBox args={[0.22, 0.06, 0.04]} radius={0.015} smoothness={2} position={[0, 0.12, 0.48]}>
          <meshStandardMaterial color={CHEST} emissive={CHEST} emissiveIntensity={2} toneMapped={false} />
        </RoundedBox>
      </group>

      {/* Floating hands */}
      <mesh ref={leftHand} position={[-0.82, -0.45, 0.05]} material={shell}>
        <sphereGeometry args={[0.17, 24, 16]} />
      </mesh>
      <mesh ref={rightHand} position={[0.82, -0.45, 0.05]} material={shell}>
        <sphereGeometry args={[0.17, 24, 16]} />
      </mesh>
    </group>
  )
}

// Drives the 'demand' frameloop at ~30fps while active.
function Ticker({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => invalidate(), 33)
    return () => window.clearInterval(id)
  }, [active, invalidate])
  return null
}

export default function Robot({ onContextLost, ...props }: RobotProps) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={hidden ? 'never' : 'demand'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0.08, 4.4], fov: 30 }}
      style={{ pointerEvents: 'none' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', () => onContextLost(), { once: true })
      }}
    >
      <Ticker active={!hidden} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-2.5, 3, 3]} intensity={2.2} color="#fff6ea" />
      <directionalLight position={[2.5, 1.5, -3]} intensity={2.4} color="#8feaff" />
      <directionalLight position={[0, -2, 2]} intensity={0.35} />
      {/* Local, GPU-rendered reflections for the clearcoat (no file downloads). */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[-3, 3, 4]} scale={[4, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#8feaff" position={[4, 0, -2]} scale={[2, 4, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={3} />
      </Environment>
      <RobotModel {...props} />
    </Canvas>
  )
}
