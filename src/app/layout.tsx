import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navbar } from '@/components/Navbar'
import { Favicon } from '@/components/Favicon'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { InteractiveBackground } from '@/components/InteractiveBackground'
import { Orbitron, Rajdhani } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-display',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Catalogue Véhicule A4L - Liste non-officielle',
  description: 'Catalogue non-officiel des véhicules du serveur Arma 3 RP Arma For Life, créé par des joueurs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <head>
        <Favicon />
      </head>
      <body className="min-h-screen bg-dark-400 military-grid font-body">
        <InteractiveBackground />
        <Providers>
          <AnalyticsTracker />
          <Navbar />
          <main className="relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
