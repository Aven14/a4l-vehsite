'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (pathname) {
      setTransitionStage('fadeOut')
      
      const timeout = setTimeout(() => {
        setDisplayChildren(children)
        setTransitionStage('fadeIn')
      }, 200)

      return () => clearTimeout(timeout)
    }
  }, [pathname, children])

  return (
    <div
      className={`page-transition ${transitionStage === 'fadeIn' ? 'page-fade-in' : 'page-fade-out'}`}
      key={pathname}
    >
      {displayChildren}
    </div>
  )
}
