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

    const timeSpeed = 0.0004

    // Define moving terrain peaks
    const peaks = [
      { x: width * 0.2, y: height * 0.3, moveRadius: 60, speed: timeSpeed },
      { x: width * 0.7, y: height * 0.6, moveRadius: 80, speed: timeSpeed * 1.2 },
      { x: width * 0.5, y: height * 0.8, moveRadius: 50, speed: timeSpeed * 0.8 },
      { x: width * 0.85, y: height * 0.2, moveRadius: 70, speed: timeSpeed * 1.1 },
      { x: width * 0.3, y: height * 0.7, moveRadius: 65, speed: timeSpeed * 0.9 },
    ]

    // Draw radial contour lines around each peak (classic topographic look)
    for (const peak of peaks) {
      const peakX = peak.x + Math.sin(time * peak.speed * 2) * peak.moveRadius
      const peakY = peak.y + Math.cos(time * peak.speed * 1.5) * peak.moveRadius
      const numRings = 15
      const maxRadius = 200

      for (let ring = 1; ring <= numRings; ring++) {
        const baseRadius = ring * (maxRadius / numRings)
        
        ctx.beginPath()
        ctx.lineWidth = 1.2
        
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
          // Organic distortion for natural look
          const distortion = 
            Math.sin(angle * 4 + time * timeSpeed * 3 + ring * 0.3) * 18 +
            Math.cos(angle * 6 + time * timeSpeed * 2 + ring * 0.2) * 12 +
            Math.sin(angle * 3 + time * timeSpeed * 4) * 15 +
            Math.cos(angle * 5 + time * timeSpeed * 2.5) * 10

          const radius = baseRadius + distortion
          const x = peakX + Math.cos(angle) * radius
          const y = peakY + Math.sin(angle) * radius

          if (angle === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        
        // Lines get lighter as they go out
        const alpha = 0.2 - (ring / numRings) * 0.12
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.stroke()
      }

      // Add small peak marker
      ctx.beginPath()
      ctx.arc(peakX, peakY, 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fill()
    }

    // Add flowing contour lines that weave between peaks
    ctx.lineWidth = 0.8
    const numFlowLines = 12
    
    for (let i = 0; i < numFlowLines; i++) {
      const baseY = (i / numFlowLines) * height
      
      ctx.beginPath()
      
      for (let x = 0; x <= width; x += 4) {
        let y = baseY
        
        // Influence from peaks
        for (const peak of peaks) {
          const peakX = peak.x + Math.sin(time * peak.speed * 2) * peak.moveRadius
          const peakY = peak.y + Math.cos(time * peak.speed * 1.5) * peak.moveRadius
          
          const dx = x - peakX
          const dy = baseY - peakY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Push lines away from peaks
          const influence = Math.exp(-(distance * distance) / (2 * 200 * 200)) * 50
          y -= influence
        }
        
        // Add wave motion
        y += Math.sin(x * 0.005 + time * timeSpeed * 2 + i * 0.5) * 20
        y += Math.cos(x * 0.003 + time * timeSpeed * 1.5) * 15

        const alpha = 0.12 + Math.sin(x * 0.01 + time * timeSpeed) * 0.03
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()
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
