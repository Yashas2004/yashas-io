'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

type Role = {
  company: string
  monogram: string
  logo: string // put the image in /public/logos/
  role: string
  start: string
  end: string
  current?: boolean
  location: string
  tech: string[]
}

export const experience: Role[] = [
  {
    company: 'Way to Credit Pvt Ltd',
    monogram: 'W2C',
    logo: '/logos/way-to-credit.png',
    role: 'Software Engineering Intern',
    start: 'Jul 2026',
    end: 'Present',
    current: true,
    location: 'Bangalore, India',
    tech: ['TypeScript', 'PostgreSQL', 'Neon', 'Redis', 'JWT', 'GitHub Actions'],
  },
  {
    company: 'Supr Mentr Technologies Pvt Ltd',
    monogram: 'SM',
    logo: '/logos/supr-mentr.png',
    role: 'AI & Cloud Intern',
    start: 'Jan 2026',
    end: 'May 2026',
    location: 'Bangalore, India',
    tech: ['Python', 'GPT-4o', 'RAG', 'ChromaDB', 'OpenAI Embeddings', 'BeautifulSoup'],
  },
]

function CompanyLogo({ src, monogram, name }: { src: string; monogram: string; name: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="xp-logo">
      {failed ? (
        <span aria-hidden="true">{monogram}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${name} logo`} onError={() => setFailed(true)} />
      )}
    </div>
  )
}

export function Experience() {
  return (
    <ol className="xp-list">
      {experience.map((job) => (
        <li className={`xp-item ${job.current ? 'is-current' : ''}`} key={job.company}>
          <div className="xp-rail" aria-hidden="true"><span /></div>
          <div className="xp-when">
            <time>{job.start}</time>
            <span aria-hidden="true">–</span>
            <time>{job.end}</time>
            {job.current && <em className="xp-now">Now</em>}
          </div>
          <article className="xp-card">
            <header className="xp-head">
              <CompanyLogo src={job.logo} monogram={job.monogram} name={job.company} />
              <div>
                <h3>{job.role}</h3>
                <p className="xp-company">{job.company}</p>
                <p className="xp-place"><MapPin aria-hidden="true" /> {job.location}</p>
              </div>
            </header>
            <ul className="xp-tech" aria-label="Technologies used">
              {job.tech.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </article>
        </li>
      ))}
    </ol>
  )
}