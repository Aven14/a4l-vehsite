'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { SiteLogo } from './SiteLogo'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user = session?.user as any
  const navLinkBase = 'nav-interactive px-2 py-1'
  const activeClass = 'text-primary-400 nav-interactive-active'

  return (
    <nav 
      className="bg-dark-200/80 backdrop-blur-md sticky top-0 z-50"
      style={{
        borderColor: `rgba(var(--accent-color-rgb, 168, 85, 247), 0.1)`,
        borderBottomWidth: '1px'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 nav-interactive px-2 py-1">
            <SiteLogo />
            <span className="font-display text-xl font-bold text-white tracking-wider hidden sm:block">
              ARMA FOR LIFE
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={`${navLinkBase} ${pathname === '/' ? activeClass : ''}`}>
              Accueil
            </Link>
            <Link href="/brands" aria-current={pathname === '/brands' ? 'page' : undefined} className={`${navLinkBase} hidden sm:block ${pathname.startsWith('/brands') ? activeClass : ''}`}>
              Marques
            </Link>
            <Link href="/vehicles" aria-current={pathname === '/vehicles' ? 'page' : undefined} className={`${navLinkBase} ${pathname.startsWith('/vehicles') ? activeClass : ''}`}>
              Véhicules
            </Link>
            <Link href="/dealerships" aria-current={pathname === '/dealerships' ? 'page' : undefined} className={`${navLinkBase} hidden sm:block ${pathname.startsWith('/dealerships') ? activeClass : ''}`}>
              Concessionnaires
            </Link>
            <a href="https://discord.gg/KeXpbkCwvm" target="_blank" rel="noopener noreferrer" className={`${navLinkBase} text-indigo-400 hover:text-indigo-300`}>
              Discord
            </a>

            {session ? (
              <div className="flex items-center gap-3">
                {user?.dealership && (
                  <Link href="/dealership" className={`${navLinkBase} text-primary-400 hover:text-primary-300`}>
                    Concess
                  </Link>
                )}
                {user?.canAccessAdmin && (
                  <Link href="/admin" className={`${navLinkBase} text-primary-400 hover:text-primary-300`}>
                    Panel
                  </Link>
                )}
                <Link href="/account" className={`${navLinkBase} text-blue-400 hover:text-blue-300`}>
                  Compte
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="nav-interactive px-2 py-1 text-red-400 hover:text-red-300 font-medium text-sm"
                >
                  Déco
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
