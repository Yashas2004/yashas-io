'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Briefcase,
  Code2,
  Download,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Terminal,
  X,
  Send,
} from 'lucide-react'
import { ParticleSphere } from './particle-sphere'
import { Experience } from './experience'
import { TerminalContact } from './terminal-contact'
import { AssistantBot } from './assistant-bot/AssistantBot'
import { ProjectCover, type CoverVariant } from './project-cover/ProjectCover'

// ── Personal details: edit these in one place ──────────────────────────────
const ME = {
  name: 'Yashas R',
  firstName: 'Yashas',
  email: 'yashas.r.2004.07@gmail.com',
  location: 'Bangalore, IN',
  resume: '/Yashas_SWE_RESUME.pdf', // file lives in /public
  resumeFileName: 'Yashas_SWE[RESUME].pdf', // name visitors get on download
}

const LINKS = {
  github: 'https://github.com/Yashas2004',
  linkedin: 'https://www.linkedin.com/in/yashas-r-790316308/',
  leetcode: 'https://leetcode.com/u/Yashas007/',
  medium: 'https://medium.com/@yashas.r.2004.07',
}

const socials = [
  { label: 'GitHub', href: LINKS.github, Icon: Code2 },
  { label: 'LinkedIn', href: LINKS.linkedin, Icon: Briefcase },
  { label: 'LeetCode', href: LINKS.leetcode, Icon: Terminal },
  { label: 'Medium', href: LINKS.medium, Icon: PenLine },
  { label: 'Email', href: `mailto:${ME.email}`, Icon: Mail },
]
// ───────────────────────────────────────────────────────────────────────────

const projects = [
  {
    number: '01',
    title: 'SnipIt',
    kind: 'URL shortener with click analytics',
    period: 'Jul – Aug 2026',
    description:
      'Short links with device, browser, OS and location analytics on every click. Tracking runs off the redirect path, so it adds no latency to the hop.',
    tags: ['React', 'Express', 'MongoDB', 'JWT', 'Google OAuth'],
    variant: 'snipit' as CoverVariant,
    link: 'https://github.com/Yashas2004/URL-shortner',
    className: 'md:col-span-7',
  },
  {
    number: '02',
    title: 'CodeVault',
    kind: 'Full-stack snippet manager',
    period: 'Jun – Jul 2026',
    description:
      'FastAPI backend with ownership-scoped CRUD, Redis cache , cursor pagination and rate limiting. Dockerised, with CI on every push.',
    tags: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Redis', 'Docker'],
    variant: 'codevault' as CoverVariant,
    link: 'https://github.com/Yashas2004/CODEVAULT',
    className: 'md:col-span-5 md:mt-24',
  },
  {
    number: '03',
    title: 'Colorize',
    kind: 'GAN-based image colorization',
    period: 'Dec 2025 – Feb 2026',
    description:
      'Conditional PatchGAN with a ResNet18 U-Net generator, trained on 10,000 COCO images in three stages. Runs as a real-time Streamlit app.',
    tags: ['PyTorch', 'ResNet18', 'fastai', 'Streamlit'],
    variant: 'colorize' as CoverVariant,
    link: 'https://github.com/Yashas2004/Image-colorization-Pipeline-using-GANs',
    className: 'md:col-span-5',
  },
  {
    number: '04',
    title: 'MailMind.io',
    kind: 'AI email drafting agent',
    period: 'Mar – Apr 2026',
    description:
      'LangGraph agent with a custom ReAct loop routing between six tools to draft, refine and save professional emails, with a live split-panel preview.',
    tags: ['LangGraph', 'LangChain', 'GPT-4o', 'Streamlit'],
    variant: 'mailmind' as CoverVariant,
    link: 'https://github.com/Yashas2004/MailMind.io-Email-Drafter-Agent',
    className: 'md:col-span-7',
  },
]

// Icons from simpleicons.org. If an icon is missing, the tile shows initials.
const si = (slug: string, color?: string) => `https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ''}`
const stackGroups = [
  {
    title: 'Languages',
    items: [
      ['Python', si('python')],
      ['TypeScript', si('typescript')],
      ['JavaScript', si('javascript')],
      ['SQL', si('postgresql')],
      ['C', si('c')],
    ],
  },
  {
    title: 'Backend & web',
    items: [
      ['FastAPI', si('fastapi')],
      ['Node.js', si('nodedotjs')],
      ['Express', si('express')],
      ['React', si('react')],
      ['Next.js', si('nextdotjs')],
      ['Tailwind', si('tailwindcss')],
      ['REST · JWT · OAuth 2.0', si('jsonwebtokens')],
    ],
  },
  {
    title: 'Data & infrastructure',
    items: [
      ['PostgreSQL', si('postgresql')],
      ['MongoDB', si('mongodb')],
      ['Redis', si('redis')],
      ['Docker', si('docker')],
      ['AWS', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg'],
      ['GitHub Actions', si('githubactions')],
      ['Postman', si('postman')],
    ],
  },
  {
    title: 'AI & ML',
    items: [
      ['PyTorch', si('pytorch')],
      ['TensorFlow', si('tensorflow')],
      ['scikit-learn', si('scikitlearn')],
      ['Hugging Face', si('huggingface')],
      ['LangChain', si('langchain')],
      ['LangGraph', si('langgraph')],
      ['OpenAI API', ''],
      ['RAG · ChromaDB', ''],
    ],
  },
]

function ToolTile({ name, icon, delay }: { name: string; icon: string; delay: number }) {
  const [broken, setBroken] = useState(!icon)
  const initials = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2)
  return (
    <li className="tool-tile">
      <span className="tool-icon" style={{ animationDelay: `${-delay}s` }}>
        {broken ? (
          <b aria-hidden="true">{initials}</b>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" loading="lazy" onError={() => setBroken(true)} />
        )}
      </span>
      <span className="tool-name">{name}</span>
    </li>
  )
}

const SUGGESTIONS = ['What is Yashas working on now?', 'Show me his projects', 'Is he open to full-time roles?']

// Yota's face, drawn to match the 3D mascot.
function YotaAvatar() {
  return (
    <span className="yota-avatar" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="16" fill="#f4f6fa" />
        <rect x="6" y="9" width="20" height="14" rx="4" fill="#05070a" />
        <rect x="10.5" y="12.5" width="3" height="4.5" rx="1.2" fill="#5ef0ff" />
        <rect x="18.5" y="12.5" width="3" height="4.5" rx="1.2" fill="#5ef0ff" />
        <path d="M13.5 19.2 Q16 21.2 18.5 19.2" stroke="#5ef0ff" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm Yota, ${ME.firstName}'s AI assistant. Ask me about his work, projects or skills.`,
    },
  ])
  const messagesRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const lastMessageCount = useRef(0)
  const [showJump, setShowJump] = useState(false)

  const scrollMessagesToBottom = (behavior: ScrollBehavior) => {
    const el = messagesRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }

  const onMessagesScroll = () => {
    const el = messagesRef.current
    if (!el) return
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (stickToBottom.current) setShowJump(false)
  }

  // Follow new messages and streamed text, unless the visitor has scrolled up to read.
  useEffect(() => {
    const isNewMessage = assistantMessages.length !== lastMessageCount.current
    lastMessageCount.current = assistantMessages.length
    if (!assistantOpen) return
    if (stickToBottom.current) scrollMessagesToBottom(isNewMessage ? 'smooth' : 'auto')
    else setShowJump(true)
  }, [assistantMessages, assistantLoading, assistantOpen])

  // Always start at the newest message when the panel (re)opens.
  useEffect(() => {
    if (!assistantOpen) return
    stickToBottom.current = true
    setShowJump(false)
    scrollMessagesToBottom('auto')
  }, [assistantOpen])

  const askAssistant = async (text?: string) => {
    const content = (text ?? assistantInput).trim()
    if (!content || assistantLoading) return
    stickToBottom.current = true
    setShowJump(false)
    const nextMessages = [...assistantMessages, { role: 'user', content }]
    setAssistantMessages(nextMessages)
    setAssistantInput('')
    setAssistantLoading(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        setAssistantMessages([
          ...nextMessages,
          { role: 'assistant', content: data.error || `Please email ${ME.firstName} at ${ME.email}.` },
        ])
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setAssistantLoading(false)
        setAssistantMessages([...nextMessages, { role: 'assistant', content: text }])
      }
      if (!text) {
        setAssistantMessages([...nextMessages, { role: 'assistant', content: `Please email ${ME.firstName} at ${ME.email}.` }])
      }
    } catch {
      setAssistantMessages([
        ...nextMessages,
        { role: 'assistant', content: `Please email ${ME.firstName} directly at ${ME.email}.` },
      ])
    } finally {
      setAssistantLoading(false)
    }
  }

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))
    return () => reveal.disconnect()
  }, [])

  const nav = [
    ['#about', 'About'],
    ['#experience', 'Experience'],
    ['#work', 'Projects'],
    ['#contact', 'Contact'],
  ]

  return (
    <main className="site-shell">
      <div className="grain" aria-hidden="true" />
      <div className="cursor-orb" aria-hidden="true" />
      <header className="site-header">
        <a href="#top" className="wordmark" aria-label={`${ME.name}, home`}>
          <span className="wordmark-y">{ME.name.charAt(0)}</span>{ME.name.slice(1)}
        </a>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          {nav.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a className="nav-resume" href={ME.resume} download={ME.resumeFileName} onClick={() => setMenuOpen(false)}>
            Résumé <Download aria-hidden="true" />
          </a>
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section id="top" className="hero section-pad hero--sphere">
        <div className="hero-grid" aria-hidden="true" />
        <ParticleSphere className="hero-sphere" />
        <div className="hero-copy">
          <p className="eyebrow reveal"> Software Engineer <span className="status-dot" />Open to Work</p>
          <div className="hero-title-wrap">
            <span className="hero-panel" aria-hidden="true" />
            <h1 className="hero-title reveal">Build It <br /><em>Scale It <br />& Deploy</em><span className="accent">.</span></h1>
          </div>
          <div className="hero-footer reveal">
            <div className="hero-socials">
              {socials.map(({ label, href, Icon }) => (
                <a key={label} href={href} {...(href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' })}>
                  <Icon aria-hidden="true" /> {label}
                </a>
              ))}
            </div>
            <div className="hero-cta">
              <a className="hero-resume" href={ME.resume} download={ME.resumeFileName}>
                <Download aria-hidden="true" />
                <span>Download résumé</span>
              </a>
              <a className="circle-link" href="#work" aria-label="Scroll to selected work"><ArrowDown /></a>
            </div>
          </div>
        </div>
        <p className="hero-hint" aria-hidden="true">Drag to spin it, click to send a pulse</p>
        <div className="hero-index">01 <span>/</span> 06</div>
      </section>

      <section id="about" className="about section-pad reveal">
        <div className="section-label"><span>02</span><span>About </span></div>
        <div className="about-content">
          <p className="statement"> Real Engineer is all  <span>about breaking it and<br/></span> rebuilding it better.</p>
          <p className="body-copy">
            I&apos;m {ME.firstName}, a software engineer in Bangalore and a 2026 CSE graduate, I work across backend systems, full-stack products and ML/RAG pipelines, and I like scoping a
            fuzzy problem with the people who have it, then shipping the system that solves it. 400+ DSA problems
            solved, one co-authored book chapter, and Ex-Vice President @RAcJIT.
          </p>
          <a className="text-link" href={LINKS.linkedin} target="_blank" rel="noreferrer">More about me <ArrowUpRight /></a>
        </div>
      </section>

      <section id="experience" className="experience section-pad reveal" aria-labelledby="experience-heading">
        <div className="section-label"><span>03</span><span>Experience</span></div>
        <div className="xp-content">
          <h1 id="experience-heading font-bold">WORKPLACE<br /><span>EXPERIENCE</span></h1>
          <Experience />
        </div>
      </section>

      <section className="stack section-pad reveal" aria-labelledby="stack-heading">
        <div className="section-label"><span>04</span><span>ToolStack</span></div>
        <div className="stack-content">
          <h2 id="stack-heading">The tools I use<br /><span>to make it real.</span></h2>
          <div className="tool-rows">
            {stackGroups.map((group, row) => (
              <div className="tool-row" key={group.title}>
                <h3>{group.title}</h3>
                <div className={`tool-track ${row % 2 ? 'is-reverse' : ''}`} style={{ ['--speed' as string]: `${28 + row * 6}s` }}>
                  {/* list is rendered twice so the loop is seamless; the copy is hidden from screen readers */}
                  {[0, 1].map((copy) => (
                    <ul className="tool-lane" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                      {group.items.map(([name, icon], i) => (
                        <ToolTile key={name} name={name} icon={icon} delay={i * 0.35} />
                      ))}
                    </ul>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="work section-pad reveal" aria-labelledby="work-heading">
        <div className="section-label"><span>05</span><span>Selected work</span></div>
        <div className="work-heading">
          <h2 id="work-heading">Recent experiments<br /><span>& shipped ideas.</span></h2>
          <p>Things I&apos;ve designed, built, and obsessed over. <br />Each one started with a question.</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className={`project-card ${project.className}`} key={project.title}>
              <a href={project.link} target="_blank" rel="noreferrer" className="project-image project-cover-link" aria-label={`${project.title} on GitHub`} aria-describedby={`cover-desc-${project.variant}`}>
                <ProjectCover variant={project.variant} />
                <span className="view-project">View <ArrowUpRight /></span>
              </a>
              <div className="project-meta">
                <span>{project.number}</span>
                <div>
                  <h3><a className="project-title-link" href={project.link} target="_blank" rel="noreferrer">{project.title}</a></h3>
                  <p className="project-kind">{project.kind} <span>{project.period}</span></p>
                  <p>{project.description}</p>
                  <div className="tag-list">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="contact section-pad reveal">
        <div className="contact-line" />
        <div className="contact-layout contact-layout--term">
          <div className="contact-intro">
            <p className="eyebrow">Have a good one in mind?</p>
            <h2>Let&apos;s Build<br /><em>Something</em> Rare<span className="accent">.</span></h2>
            <p className="contact-note">
              Open to work on anything that is crazy to think about...!
            </p>
            <ul className="contact-socials">
              {socials.filter((s) => s.label !== 'Email').map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer"><Icon aria-hidden="true" /> {label} <ArrowUpRight aria-hidden="true" /></a>
                </li>
              ))}
            </ul>
          </div>
          <TerminalContact email={ME.email} />
        </div>
      </section>

      <aside className={`assistant-widget ${assistantOpen ? 'is-open' : ''}`} aria-label="Portfolio assistant">
        <AssistantBot open={assistantOpen} onToggle={() => setAssistantOpen((o) => !o)} name={ME.firstName} />
        {assistantOpen && (
          <div className="assistant-panel">
            <div className="assistant-panel-head">
              <div className="assistant-id">
                <YotaAvatar />
                <span className="assistant-id-text">
                  <strong>Yota</strong>
                  <span className="assistant-status"><i aria-hidden="true" />{ME.firstName}&apos;s AI assistant</span>
                </span>
              </div>
              <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Close assistant"><X /></button>
            </div>
            <div className="assistant-messages" ref={messagesRef} onScroll={onMessagesScroll}>
              {assistantMessages.map((message, index) => (
                <p className={message.role} key={`${message.role}-${index}`}>{message.content}</p>
              ))}
              {!assistantMessages.some((m) => m.role === 'user') && (
                <div className="assistant-chips">
                  {SUGGESTIONS.map((q) => (
                    <button key={q} type="button" onClick={() => askAssistant(q)} disabled={assistantLoading}>{q}</button>
                  ))}
                </div>
              )}
              {assistantLoading && (
                <div className="assistant-typing" role="status" aria-label="Yota is typing"><span /><span /><span /></div>
              )}
              {showJump && (
                <button
                  type="button"
                  className="assistant-jump"
                  onClick={() => {
                    stickToBottom.current = true
                    setShowJump(false)
                    scrollMessagesToBottom('smooth')
                  }}
                >
                  ↓ New message
                </button>
              )}
            </div>
            <form className="assistant-input" onSubmit={(event) => { event.preventDefault(); askAssistant() }}>
              <textarea
                rows={1}
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends, Shift+Enter adds a new line.
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    askAssistant()
                  }
                }}
                placeholder={`Ask Yota anything about ${ME.firstName}…`}
                aria-label="Ask Yota a question"
              />
              <button type="submit" aria-label="Send question" disabled={assistantLoading || !assistantInput.trim()}><Send /></button>
            </form>
          </div>
        )}
      </aside>

      <footer className="site-footer">
        <span className="footer-name">© {new Date().getFullYear()} {ME.name}</span>
        <div className="footer-links">
          {socials.map(({ label, href, Icon }) => (
            <a key={label} href={href} {...(href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noreferrer' })}>
              <Icon /> {label}
            </a>
          ))}
        </div>
        <span className="location"><MapPin /> {ME.location}</span>
      </footer>
    </main>
  )
}