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
    const waveAmplitude = 12
    const waveSpeed = 0.0008
    const waveFrequency = 0.015

    // Calculate wave offset for each grid line
    const drawWaveGrid = () => {
      ctx.lineWidth = 1

      // Draw vertical lines with wave effect
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath()
        
        for (let y = 0; y <= height; y += 5) {
          // Calculate distance from mouse for interactive effect
          const dx = x - mousePosition.current.x
          const dy = y - mousePosition.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const mouseInfluence = Math.max(0, 1 - distance / 400)

          // Multiple wave layers for 3D effect
          const waveOffset = 
            Math.sin(y * waveFrequency + time * waveSpeed) * waveAmplitude * (1 + mouseInfluence * 0.8) +
            Math.cos(y * waveFrequency * 0.7 + time * waveSpeed * 1.2) * waveAmplitude * 0.6 +
            Math.sin((x + y) * 0.01 + time * waveSpeed * 0.5) * waveAmplitude * 0.4 // Diagonal wave

          const adjustedX = x + waveOffset

          // Vary opacity based on wave position for 3D depth effect
          const depthFactor = Math.sin(y * 0.005 + time * 0.0003) * 0.5 + 0.5
          const alpha = 0.03 + depthFactor * 0.04
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`

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
          // Calculate distance from mouse for interactive effect
          const dx = x - mousePosition.current.x
          const dy = y - mousePosition.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const mouseInfluence = Math.max(0, 1 - distance / 400)

          // Multiple wave layers for 3D effect
          const waveOffset = 
            Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude * (1 + mouseInfluence * 0.8) +
            Math.cos(x * waveFrequency * 0.7 + time * waveSpeed * 1.2) * waveAmplitude * 0.6 +
            Math.sin((x + y) * 0.01 + time * waveSpeed * 0.5) * waveAmplitude * 0.4 // Diagonal wave

          const adjustedY = y + waveOffset

          // Vary opacity based on wave position for 3D depth effect
          const depthFactor = Math.sin(x * 0.005 + time * 0.0003) * 0.5 + 0.5
          const alpha = 0.03 + depthFactor * 0.04
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`

          if (x === 0) {
            ctx.moveTo(x, adjustedY)
          } else {
            ctx.lineTo(x, adjustedY)
          }
        }
        
        ctx.stroke()
      }

      // Draw diagonal wave lines for enhanced 3D effect
      ctx.lineWidth = 0.5
      for (let i = -height; i <= width + height; i += gridSize * 2) {
        // Diagonal lines from bottom-left to top-right
        ctx.beginPath()
        for (let x = 0; x <= width; x += 5) {
          const baseY = i - x
          if (baseY < 0 || baseY > height) continue

          const dx = x - mousePosition.current.x
          const dy = baseY - mousePosition.current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const mouseInfluence = Math.max(0, 1 - distance / 400)

          const waveOffset = 
            Math.sin((x + baseY) * 0.008 + time * waveSpeed * 1.5) * waveAmplitude * 1.2 * (1 + mouseInfluence * 0.6) +
            Math.cos((x - baseY) * 0.005 + time * waveSpeed * 0.8) * waveAmplitude * 0.5

          const adjustedY = baseY + waveOffset
          const depthFactor = Math.sin((x + baseY) * 0.003 + time * 0.0002) * 0.5 + 0.5
          const alpha = 0.02 + depthFactor * 0.03
          ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`

          if (x === 0 || baseY < 0) {
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
        300
      )
      glowGradient.addColorStop(0, `rgba(${accentRgb}, 0.08)`)
      glowGradient.addColorStop(0.3, `rgba(${accentRgb}, 0.03)`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(mousePosition.current.x, mousePosition.current.y, 300, 0, Math.PI * 2)
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
