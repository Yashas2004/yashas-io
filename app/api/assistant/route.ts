import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const profile = `You are the portfolio assistant for Alex Morgan, an independent full-stack developer and creative technologist based in Toronto, Canada. Alex creates thoughtful, high-performance digital products and expressive interfaces. Alex works with React, Next.js, TypeScript, Node.js, PostgreSQL, WebGL, Framer Motion, Astro, headless CMS tools, and product design. Selected projects include Orbit / Finance OS, Luma / Spatial Notes, and North / Field Guide. Alex is available for select freelance collaborations and can be reached at hello@alexmorgan.dev. Be concise, warm, specific, and never invent personal details. If asked for something you do not know, say so and suggest contacting Alex directly.`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const conversation = Array.isArray(messages)
      ? messages.slice(-12).map((message: { role?: string; content?: string }) => `${message.role === 'assistant' ? 'Assistant' : 'Visitor'}: ${String(message.content ?? '').slice(0, 1200)}`).join('\n')
      : ''

    const { text } = await generateText({
      model: 'zai/glm-5.3-flash',
      system: profile,
      prompt: conversation || 'Introduce yourself and explain what you can help visitors discover.',
    })

    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: 'The assistant is taking a quick pause. Please email Alex directly.' }, { status: 500 })
  }
}
