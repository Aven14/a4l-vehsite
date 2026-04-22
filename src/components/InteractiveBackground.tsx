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

    const timeSpeed = 0.00015
    const numLines = 30

    ctx.lineWidth = 1

    for (let i = 0; i < numLines; i++) {
      const baseY = (i / numLines) * height

      ctx.beginPath()

      for (let x = 0; x <= width; x += 2) {
        let y = baseY

        // Multiple wave layers for organic deformation
        y += Math.sin(x * 0.003 + time * timeSpeed * 1.2 + i * 0.5) * 40
        y += Math.cos(x * 0.005 - time * timeSpeed * 0.8 + i * 0.3) * 30
        y += Math.sin(x * 0.004 + time * timeSpeed * 1.5 + i * 0.7) * 35
        y += Math.cos(x * 0.007 + time * timeSpeed * 0.6 + i * 0.4) * 25
        y += Math.sin((x * 0.002 + i * 0.2) * Math.cos(time * timeSpeed * 0.5)) * 45
        y += Math.cos(x * 0.006 - time * timeSpeed * 1.1 + i * 0.6) * 28
        
        // Additional irregular distortions
        y += Math.sin(x * 0.008 + time * timeSpeed * 1.8) * Math.cos(i * 0.8) * 20
        y += Math.cos(x * 0.009 - time * timeSpeed * 0.9) * Math.sin(i * 0.7) * 22
        y += Math.sin(x * 0.001 + i * 0.3 + time * timeSpeed * 0.4) * 50

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      // Index contours every 5th line are thicker
      if (i % 5 === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1.8
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
        ctx.lineWidth = 1
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
