'use client'

import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Check,
  Code2,
  Copy,
  Mail,
  MapPin,
  Menu,
  MoveUpRight,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react'

const projects = [
  {
    number: '01',
    title: 'Orbit / Finance OS',
    description: 'A calm, high-signal command center for modern money teams.',
    tags: ['Next.js', 'TypeScript', 'Postgres'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85',
    className: 'md:col-span-7',
  },
  {
    number: '02',
    title: 'Luma / Spatial Notes',
    description: 'A tactile knowledge workspace built for ideas in motion.',
    tags: ['React', 'WebGL', 'Framer Motion'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
    className: 'md:col-span-5 md:mt-24',
  },
  {
    number: '03',
    title: 'North / Field Guide',
    description: 'A digital trail system that makes the outdoors feel closer.',
    tags: ['Astro', 'Headless CMS', 'UX'],
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    className: 'md:col-span-5',
  },
]

const stack = [
  ['01', 'React / Next.js'],
  ['02', 'TypeScript'],
  ['03', 'Node / PostgreSQL'],
  ['04', 'Motion / WebGL'],
  ['05', 'Product Design'],
]

export function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el))
    return () => reveal.disconnect()
  }, [])

  const copyEmail = async () => {
    await navigator.clipboard?.writeText('hello@alexmorgan.dev')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <main className="site-shell">
      <div className="grain" aria-hidden="true" />
      <div className="cursor-orb" aria-hidden="true" />
      <header className="site-header">
        <a href="#top" className="wordmark" aria-label="Alex Morgan home"><span>AM</span><small>Alex Morgan / 2025</small></a>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section id="top" className="hero section-pad">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow reveal">Independent developer <span className="status-dot" /> Available for select work</p>
          <h1 className="hero-title reveal">I build digital<br /><em>things</em> with intent<span className="accent">.</span></h1>
          <div className="hero-footer reveal">
            <p>Design-minded engineer crafting thoughtful products, expressive interfaces, and systems that quietly do more.</p>
            <a className="circle-link" href="#work" aria-label="Scroll to selected work"><ArrowDown /></a>
          </div>
        </div>
        <div className="hero-index">01 <span>/</span> 04</div>
        <div className="hero-graphic" aria-hidden="true"><div className="orb-ring ring-one" /><div className="orb-ring ring-two" /><div className="orb-ring ring-three" /><div className="orb-core" /></div>
      </section>

      <section id="about" className="about section-pad reveal">
        <div className="section-label"><span>02</span><span>About / Approach</span></div>
        <div className="about-content"><p className="statement">I turn complex problems into <span>clear, compelling</span> digital experiences.</p><p className="body-copy">I&apos;m Alex — a full-stack developer and creative technologist based in Toronto. I care about the details people feel but rarely name: the rhythm of an interaction, the weight of a typeface, the moment a product clicks.</p><a className="text-link" href="mailto:hello@alexmorgan.dev">More about me <ArrowUpRight /></a></div>
      </section>

      <section className="stack section-pad reveal" aria-labelledby="stack-heading">
        <div className="section-label"><span>03</span><span>Toolkit / Stack</span></div>
        <div className="stack-content"><h2 id="stack-heading">The tools I use<br /><span>to make it real.</span></h2><div className="stack-list">{stack.map(([num, name]) => <div className="stack-row" key={name}><span>{num}</span><strong>{name}</strong><ArrowUpRight /></div>)}</div></div>
      </section>

      <section id="work" className="work section-pad reveal" aria-labelledby="work-heading">
        <div className="section-label"><span>04</span><span>Selected work</span></div>
        <div className="work-heading"><h2 id="work-heading">Recent experiments<br /><span>& shipped ideas.</span></h2><p>Some things I&apos;ve designed, built, and obsessed over. <br />Each one started with a question.</p></div>
        <div className="project-grid">{projects.map((project) => <article className={`project-card ${project.className}`} key={project.title}><a href="https://github.com" target="_blank" rel="noreferrer" className="project-image"><img src={project.image} alt="" /><span className="view-project">View <ArrowUpRight /></span></a><div className="project-meta"><span>{project.number}</span><div><h3>{project.title}</h3><p>{project.description}</p><div className="tag-list">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></article>)}</div>
      </section>

      <section id="contact" className="contact section-pad reveal"><div className="contact-line" /><div className="contact-layout"><div><p className="eyebrow">Have a good one in mind?</p><h2>Let&apos;s make<br /><em>something</em> useful<span className="accent">.</span></h2></div><div className="contact-actions"><a className="primary-cta" href="mailto:hello@alexmorgan.dev">Start a conversation <ArrowUpRight /></a><button className="email-copy" onClick={copyEmail}>{copied ? <Check /> : <Copy />} {copied ? 'Copied to clipboard' : 'hello@alexmorgan.dev'}</button></div></div></section>

      <footer className="site-footer"><div><Braces /> <span>Built with care / 2025</span></div><div className="footer-links"><a href="https://github.com" target="_blank" rel="noreferrer"><Code2 /> GitHub</a><a href="https://linkedin.com" target="_blank" rel="noreferrer"><Terminal /> LinkedIn</a><a href="mailto:hello@alexmorgan.dev"><Mail /> Email</a></div><span className="location"><MapPin /> Toronto, CA</span></footer>
    </main>
  )
}
