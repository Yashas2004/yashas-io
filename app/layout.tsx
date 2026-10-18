import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import './portfolio-extras.css'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './loader.css'
import { IntroLoader } from '@/components/intro-loader'

// Inter 300 is used by the intro loader only.
const inter = Inter({ subsets: ['latin'], weight: '300', display: 'swap' })

export const metadata: Metadata = {
  title: 'Yashas.io',
  description: 'Independent developer and creative technologist crafting thoughtful digital products and expressive interfaces.',
  generator: 'Yashas',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0b0d',
}

// Runs before the loader is parsed:
// - repeat visit this session → hide the loader before first paint (no flash);
// - otherwise lock scroll, and enforce the hard cap (4.5s, or 0.6s with reduced motion) here rather than in
//   React, so it holds even if the app's JavaScript is slow to hydrate. IntroLoader handles the normal path.
const introScript = `(function(){var d=document.documentElement,w=window;try{if(sessionStorage.getItem('introSeen')==='1'){d.classList.add('intro-skip');w.__introDone=true;return}}catch(e){}d.classList.add('intro-active');var rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}setTimeout(function(){if(w.__introDone)return;d.classList.add('intro-timeout');d.classList.remove('intro-active');try{sessionStorage.setItem('introSeen','1')}catch(e){}w.__introDone=true;w.dispatchEvent(new Event('intro:done'))},Math.max(0,(rm?600:4500)-performance.now()))})()`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript><style>{'#intro-loader{display:none}'}</style></noscript>
        <IntroLoader fontFamily={inter.style.fontFamily} />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
