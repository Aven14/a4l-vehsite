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
    const gridSize = 60
    const perspectiveLines = 30 // Nombre de lignes horizontales pour la perspective
    const waveAmplitude = 15
    const waveSpeed = 0.0006

    // Draw horizontal lines with wave effect coming towards viewer
    for (let i = 0; i < perspectiveLines; i++) {
      // Create perspective effect - lines closer together at top
      const baseY = Math.pow(i / perspectiveLines, 1.5) * height
      
      ctx.beginPath()
      
      for (let x = 0; x <= width; x += 4) {
        // Calculate distance from mouse
        const dx = x - mousePosition.current.x
        const dy = baseY - mousePosition.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const mouseInfluence = Math.max(0, 1 - distance / 500)

        // Wave coming towards viewer - stronger at bottom
        const depthFactor = i / perspectiveLines
        const waveOffset = 
          Math.sin(x * 0.008 + time * waveSpeed + i * 0.3) * waveAmplitude * depthFactor * (1 + mouseInfluence * 0.6) +
          Math.cos(x * 0.005 + time * waveSpeed * 0.7 + i * 0.2) * waveAmplitude * 0.5 * depthFactor +
          Math.sin((x * 0.003 + time * waveSpeed * 0.5) * (1 + depthFactor)) * waveAmplitude * 0.3

        const adjustedY = baseY + waveOffset

        // Lines get more opaque as they get closer (at bottom)
        const alpha = 0.02 + depthFactor * 0.06
        ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`
        ctx.lineWidth = 0.5 + depthFactor * 1.5

        if (x === 0) {
          ctx.moveTo(x, adjustedY)
        } else {
          ctx.lineTo(x, adjustedY)
        }
      }
      
      ctx.stroke()
    }

    // Draw vertical perspective lines
    const verticalLines = 25
    for (let i = 0; i <= verticalLines; i++) {
      const baseX = (i / verticalLines) * width
      
      ctx.beginPath()
      ctx.lineWidth = 0.5

      for (let y = 0; y <= height; y += 5) {
        // Calculate distance from mouse
        const dx = baseX - mousePosition.current.x
        const dy = y - mousePosition.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const mouseInfluence = Math.max(0, 1 - distance / 500)

        // Vertical lines also wave but less
        const depthFactor = y / height
        const waveOffset = 
          Math.sin(y * 0.003 + time * waveSpeed * 0.5) * waveAmplitude * 0.3 * depthFactor +
          Math.cos(y * 0.002 + time * waveSpeed * 0.3) * 3

        const adjustedX = baseX + waveOffset

        // Fades at top, stronger at bottom
        const alpha = 0.01 + depthFactor * 0.04
        ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`

        if (y === 0) {
          ctx.moveTo(adjustedX, y)
        } else {
          ctx.lineTo(adjustedX, y)
        }
      }
      
      ctx.stroke()
    }

    // Draw additional diagonal waves for depth
    ctx.lineWidth = 0.3
    for (let i = -height; i <= width; i += 100) {
      ctx.beginPath()
      
      for (let x = 0; x <= width; x += 5) {
        const baseY = (x + i) * 0.5
        if (baseY < 0 || baseY > height) continue

        const depthFactor = baseY / height
        const waveOffset = 
          Math.sin((x + baseY) * 0.006 + time * waveSpeed * 1.2) * waveAmplitude * 0.4 * depthFactor

        const adjustedY = baseY + waveOffset
        const alpha = 0.015 + depthFactor * 0.025
        ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`

        if (x === 0) {
          ctx.moveTo(x, adjustedY)
        } else {
          ctx.lineTo(x, adjustedY)
        }
      }
      
      ctx.stroke()
    }

    // Draw mouse glow effect
    if (mousePosition.current.x > 0 && mousePosition.current.y > 0) {
      const glowGradient = ctx.createRadialGradient(
        mousePosition.current.x,
        mousePosition.current.y,
        0,
        mousePosition.current.x,
        mousePosition.current.y,
        350
      )
      glowGradient.addColorStop(0, `rgba(${accentRgb}, 0.1)`)
      glowGradient.addColorStop(0.5, `rgba(${accentRgb}, 0.03)`)
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(mousePosition.current.x, mousePosition.current.y, 350, 0, Math.PI * 2)
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
      timeRef.current += 16
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
