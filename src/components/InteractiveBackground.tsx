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

  const drawAnimatedGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)

    const accentRgb = '17, 134, 208'
    const gridSize = 50
    const waveAmplitude = 8
    const waveSpeed = 0.001
    const waveFrequency = 0.02

    // Calculate wave offset for each grid line
    const drawWaveGrid = () => {
      ctx.strokeStyle = `rgba(${accentRgb}, 0.04)`
      ctx.lineWidth = 1

      // Draw vertical lines with wave effect
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath()
        
        for (let y = 0; y <= height; y += 5) {
          // Calculate wave offset based on position and time
          const dx = x - mousePosition.current.x
          const dy = y - mousePosition.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const mouseInfluence = Math.max(0, 1 - distance / 400)

          const waveOffset = Math.sin(y * waveFrequency + time * waveSpeed) * waveAmplitude * (1 + mouseInfluence * 0.5) +
                            Math.cos(y * waveFrequency * 0.5 + time * waveSpeed * 0.7) * waveAmplitude * 0.5

          const adjustedX = x + waveOffset

          if (y === 0) {
            ctx.moveTo(adjustedX, y)
          } else {
            ctx.lineTo(adjustedX, y)
          }
        }
        
        ctx.stroke()
      }

      // Draw horizontal lines with wave effect
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath()
        
        for (let x = 0; x <= width; x += 5) {
          // Calculate wave offset based on position and time
          const dx = x - mousePosition.current.x
          const dy = y - mousePosition.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const mouseInfluence = Math.max(0, 1 - distance / 400)

          const waveOffset = Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude * (1 + mouseInfluence * 0.5) +
                            Math.cos(x * waveFrequency * 0.5 + time * waveSpeed * 0.7) * waveAmplitude * 0.5

          const adjustedY = y + waveOffset

          if (x === 0) {
            ctx.moveTo(x, adjustedY)
          } else {
            ctx.lineTo(x, adjustedY)
          }
        }
        
        ctx.stroke()
      }
    }

    drawWaveGrid()

    // Draw subtle mouse glow effect
    if (mousePosition.current.x > 0 && mousePosition.current.y > 0) {
      const glowGradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        250
      )
      glowGradient.addColorStop(0, `rgba(${accentRgb}, 0.06)`)
      glowGradient.addColorStop(0.5, `rgba(${accentRgb}, 0.02)`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(mousePosition.current.x, mousePosition.current.y, 250, 0, Math.PI * 2)
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
      drawAnimatedGrid(ctx, width, height, timeRef.current)
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
  }, [drawAnimatedGrid])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  )
}
