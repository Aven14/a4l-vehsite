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

    const lineSpacing = 30
    const timeSpeed = 0.0003
    const numLines = Math.ceil(height / lineSpacing) + 10

    // Draw topographic lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1

    for (let i = -5; i < numLines; i++) {
      ctx.beginPath()

      for (let x = 0; x <= width; x += 3) {
        // Create organic topographic wave patterns
        const baseY = i * lineSpacing

        // Multiple overlapping sine waves for natural topographic feel
        const y = baseY +
          Math.sin(x * 0.003 + time * timeSpeed * 2 + i * 0.5) * 25 +
          Math.cos(x * 0.005 + time * timeSpeed * 1.5 + i * 0.3) * 20 +
          Math.sin((x * 0.002 + time * timeSpeed) * Math.cos(i * 0.2)) * 30 +
          Math.cos(x * 0.007 + time * timeSpeed * 2.5) * 15 +
          Math.sin(x * 0.001 + i * 0.8 + time * timeSpeed * 0.5) * 35

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      // Vary opacity based on wave position for depth
      const wavePosition = Math.sin(i * 0.3 + time * timeSpeed) * 0.5 + 0.5
      const alpha = 0.08 + wavePosition * 0.12
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      
      ctx.stroke()
    }

    // Add some circular topographic features (like hills/mountains)
    const numFeatures = 5
    for (let f = 0; f < numFeatures; f++) {
      const centerX = width * (0.2 + f * 0.15) + Math.sin(time * timeSpeed + f) * 100
      const centerY = height * (0.3 + (f % 2) * 0.4) + Math.cos(time * timeSpeed * 0.8 + f) * 80
      const numRings = 8
      const maxRadius = 120

      for (let r = 0; r < numRings; r++) {
        const baseRadius = (r + 1) * (maxRadius / numRings)
        
        ctx.beginPath()
        
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
          // Distort the circle to make it organic
          const distortion = 
            Math.sin(angle * 3 + time * timeSpeed * 2 + f) * 15 +
            Math.cos(angle * 5 + time * timeSpeed * 1.5) * 10 +
            Math.sin(angle * 2 + f * 0.5) * 20

          const radius = baseRadius + distortion
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (angle === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        const alpha = 0.05 + (1 - r / numRings) * 0.1
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.stroke()
      }
    }

    // Add flowing stream lines
    ctx.lineWidth = 0.5
    for (let s = 0; s < 3; s++) {
      ctx.beginPath()
      
      for (let x = 0; x <= width; x += 2) {
        const y = height * (0.25 + s * 0.25) +
          Math.sin(x * 0.004 + time * timeSpeed * 3 + s * 2) * 50 +
          Math.cos(x * 0.006 + time * timeSpeed * 2) * 40 +
          Math.sin(x * 0.002 + time * timeSpeed) * 60

        const alpha = 0.1 + Math.sin(x * 0.01 + time * timeSpeed * 2) * 0.05
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
