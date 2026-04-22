'use client'

import { useEffect, useRef, useCallback } from 'react'

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number>()
  const timeRef = useRef<number>(0)

  const drawTopographicMap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)
    
    // Dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    const timeSpeed = 0.0003
    const numLines = 25
    const lineSpacing = height / (numLines - 1)

    // Draw main topographic contour lines
    ctx.lineWidth = 1

    for (let i = 0; i < numLines; i++) {
      const baseY = i * lineSpacing

      ctx.beginPath()

      for (let x = 0; x <= width; x += 3) {
        // Create topographic wave patterns - lines going left to right with curves
        let y = baseY

        // Multiple overlapping waves for organic topographic feel
        y += Math.sin(x * 0.004 + time * timeSpeed * 2 + i * 0.4) * 25
        y += Math.cos(x * 0.006 + time * timeSpeed * 1.5 + i * 0.3) * 18
        y += Math.sin(x * 0.003 + time * timeSpeed + i * 0.2) * 30
        y += Math.cos(x * 0.008 + time * timeSpeed * 2.5 + i * 0.5) * 12
        y += Math.sin(x * 0.002 + time * timeSpeed * 0.5 + i * 0.6) * 35

        // Add some hill/mountain bumps
        const hill1X = width * 0.3 + Math.sin(time * timeSpeed * 1.5) * 80
        const hill1Y = height * 0.4
        const dist1 = Math.sqrt(Math.pow(x - hill1X, 2) + Math.pow(baseY - hill1Y, 2))
        y += Math.exp(-dist1 * dist1 / (2 * 150 * 150)) * 60

        const hill2X = width * 0.7 + Math.cos(time * timeSpeed * 1.2) * 100
        const hill2Y = height * 0.7
        const dist2 = Math.sqrt(Math.pow(x - hill2X, 2) + Math.pow(baseY - hill2Y, 2))
        y += Math.exp(-dist2 * dist2 / (2 * 180 * 180)) * 70

        const hill3X = width * 0.5 + Math.sin(time * timeSpeed * 1.8) * 60
        const hill3Y = height * 0.25
        const dist3 = Math.sqrt(Math.pow(x - hill3X, 2) + Math.pow(baseY - hill3Y, 2))
        y += Math.exp(-dist3 * dist3 / (2 * 120 * 120)) * 50

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      // Vary opacity and color for depth
      const alpha = 0.1 + Math.sin(i * 0.3 + time * timeSpeed) * 0.05
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.stroke()
    }

    // Add elevation markers on some lines
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
    
    for (let i = 0; i < numLines; i += 3) {
      const baseY = i * lineSpacing
      const markerX = width * 0.1 + Math.sin(time * timeSpeed + i) * 30
      let markerY = baseY
      
      markerY += Math.sin(markerX * 0.004 + time * timeSpeed * 2 + i * 0.4) * 25
      markerY += Math.cos(markerX * 0.006 + time * timeSpeed * 1.5 + i * 0.3) * 18
      
      const elevation = Math.floor(100 + i * 20)
      ctx.fillText(`${elevation}m`, markerX, markerY - 5)
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

    const animate = () => {
      timeRef.current += 16
      drawTopographicMap(ctx, width, height, timeRef.current)
      animationFrameId.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      updateCanvasSize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [drawTopographicMap])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  )
}
