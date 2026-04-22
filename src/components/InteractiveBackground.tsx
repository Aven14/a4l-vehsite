'use client'

import { useEffect, useRef, useCallback } from 'react'

interface MousePosition {
  x: number
  y: number
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePosition = useRef<MousePosition>({ x: 0, y: 0 })
  const animationFrameId = useRef<number>()

  const drawWave = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)

    // Create gradient based on mouse position
    const gradient = ctx.createRadialGradient(
      mousePosition.current.x,
      mousePosition.current.y,
      0,
      mousePosition.current.x,
      mousePosition.current.y,
      Math.max(width, height) * 0.8
    )

    const accentRgb = '17, 134, 208' // Default accent color RGB
    gradient.addColorStop(0, `rgba(${accentRgb}, 0.08)`)
    gradient.addColorStop(0.5, `rgba(${accentRgb}, 0.03)`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    // Draw multiple wave layers
    for (let layer = 0; layer < 3; layer++) {
      ctx.beginPath()
      ctx.moveTo(0, height)

      const amplitude = 30 + layer * 15
      const frequency = 0.002 + layer * 0.001
      const speed = 0.0005 + layer * 0.0002
      const yOffset = height * 0.6 + layer * 40

      for (let x = 0; x <= width; x += 5) {
        // Calculate distance from mouse for interactive effect
        const dx = x - mousePosition.current.x
        const dy = yOffset - mousePosition.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const mouseInfluence = Math.max(0, 1 - distance / 400)

        const y = yOffset +
          Math.sin(x * frequency + time * speed * 1000 + layer) * amplitude * (1 + mouseInfluence * 0.5) +
          Math.cos(x * frequency * 1.5 + time * speed * 800) * amplitude * 0.3

        ctx.lineTo(x, y)
      }

      ctx.lineTo(width, height)
      ctx.closePath()

      const alpha = 0.02 - layer * 0.005
      ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`
      ctx.fill()
    }

    // Draw mouse glow effect
    const glowGradient = ctx.createRadialGradient(
      mousePosition.current.x,
      mousePosition.current.y,
      0,
      mousePosition.current.x,
      mousePosition.current.y,
      150
    )
    glowGradient.addColorStop(0, `rgba(${accentRgb}, 0.15)`)
    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glowGradient
    ctx.fillRect(
      mousePosition.current.x - 150,
      mousePosition.current.y - 150,
      300,
      300
    )
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)

    let startTime = Date.now()
    const animate = () => {
      const currentTime = Date.now() - startTime
      drawWave(ctx, canvas.width, canvas.height, currentTime)
      animationFrameId.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [drawWave])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}
