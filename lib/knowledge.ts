import { readFileSync } from 'node:fs'
import path from 'node:path'

// Server-only: reads the markdown knowledge base used by /api/assistant.
const FILES = ['profile.md', 'experience.md', 'projects.md', 'skills.md', 'achievements.md', 'faq.md']
const DIR = path.join(process.cwd(), 'content', 'knowledge')
const WARN_CHARS = 10_000

let cache: string | null = null

export function getKnowledge(): string {
  if (cache !== null) return cache
  const text = FILES.map((file) => readFileSync(path.join(DIR, file), 'utf8').trim()).join('\n\n')
  if (text.length > WARN_CHARS) {
    console.warn(`[knowledge] knowledge base is ${text.length} chars (> ${WARN_CHARS}); this costs tokens on every request.`)
  }
  cache = text
  return text
}
