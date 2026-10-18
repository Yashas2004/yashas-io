// Shared "intro loader finished" signal. Heavy animations (Yota, the hero sphere, project covers)
// wait for it so they don't compete with the loader for the first paint.

export const INTRO_DONE_EVENT = 'intro:done'

declare global {
  interface Window {
    __introDone?: boolean
  }
}

export function isIntroDone() {
  return typeof window !== 'undefined' && window.__introDone === true
}

/** Marks the intro as finished and notifies listeners (idempotent). */
export function markIntroDone() {
  if (window.__introDone) return
  window.__introDone = true
  window.dispatchEvent(new Event(INTRO_DONE_EVENT))
}

/** Runs `cb` once the intro has finished (immediately if it already has). Returns an unsubscribe function. */
export function onIntroDone(cb: () => void): () => void {
  if (isIntroDone()) {
    cb()
    return () => {}
  }
  const handler = () => cb()
  window.addEventListener(INTRO_DONE_EVENT, handler, { once: true })
  return () => window.removeEventListener(INTRO_DONE_EVENT, handler)
}
