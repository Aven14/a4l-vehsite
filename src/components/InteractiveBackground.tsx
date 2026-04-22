'use client'

import { useEffect, useRef, useCallback } from 'react'

interface MousePosition {
  x: number
  y: number
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosition = useRef<MousePosition>({ x: -1000, y: -1000 })
  const animationFrameId = useRef<number>()
  const timeRef = useRef<number>(0)

  const drawWave = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)

    const accentRgb = '17, 134, 208'

    // Draw multiple wave layers
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath()

      const amplitude = 40 + layer * 20
      const frequency = 0.001 + layer * 0.0005
      const speed = 0.0003 + layer * 0.0001
      const yOffset = height * 0.5 + layer * 50

      for (let x = 0; x <= width; x += 10) {
        // Calculate distance from mouse for interactive effect
        const dx = x - mousePosition.current.x
        const dy = yOffset - mousePosition.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const mouseInfluence = Math.max(0, 1 - distance / 500)

        const y = yOffset +
          Math.sin(x * frequency + time * speed + layer) * amplitude * (1 + mouseInfluence * 0.3) +
          Math.cos(x * frequency * 2 + time * speed * 1.5) * amplitude * 0.5

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()

      const alpha = 0.03 - layer * 0.008
      ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`
      ctx.fill()
    }

    // Draw mouse glow effect
    if (mousePosition.current.x > 0 && mousePosition.current.y > 0) {
      const glowGradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        200
      )
      glowGradient.addColorStop(0, `rgba(${accentRgb}, 0.08)`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(mousePosition.current.x, mousePosition.current.y, 200, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    
    const updateCanvasSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    canvas.width = width
    canvas.height = height

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mousePosition.current = { x: -1000, y: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      timeRef.current += 16 // approximately 60fps
      drawWave(ctx, width, height, timeRef.current)
      animationFrameId.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      updateCanvasSize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [drawWave])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.5 }}
    />
  )
}
