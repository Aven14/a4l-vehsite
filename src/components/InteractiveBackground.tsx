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

    const timeSpeed = 0.0001
    const gridSize = 20
    const cols = Math.floor(width / gridSize) + 1
    const rows = Math.floor(height / gridSize) + 1

    // Generate terrain height map
    const terrain: number[][] = []
    
    for (let y = 0; y < rows; y++) {
      terrain[y] = []
      for (let x = 0; x < cols; x++) {
        let height = 0
        
        // Multiple organic layers
        height += Math.sin(x * 0.15 + time * timeSpeed * 2) * Math.cos(y * 0.12 + time * timeSpeed * 1.5) * 50
        height += Math.sin(x * 0.08 - time * timeSpeed * 1.3) * Math.sin(y * 0.1 + time * timeSpeed * 1.8) * 40
        height += Math.cos(x * 0.06 + y * 0.07 + time * timeSpeed * 0.9) * 45
        height += Math.sin((x + y) * 0.05 + time * timeSpeed * 1.6) * 35
        height += Math.cos(x * 0.09 - y * 0.05 + time * timeSpeed * 1.2) * 30
        height += Math.sin(x * 0.04 + time * timeSpeed * 2.2) * Math.cos(y * 0.06 - time * timeSpeed * 1.9) * 25
        
        terrain[y][x] = height
      }
    }

    // Draw contour lines using simplified marching squares
    const contourLevels = [-80, -60, -40, -20, 0, 20, 40, 60, 80]
    
    for (const level of contourLevels) {
      ctx.beginPath()
      ctx.lineWidth = level % 40 === 0 ? 1.5 : 1
      ctx.strokeStyle = level % 40 === 0 ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.12)'

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const v1 = terrain[y][x]
          const v2 = terrain[y][x + 1]
          const v3 = terrain[y + 1][x + 1]
          const v4 = terrain[y + 1][x]

          // Check if contour passes through this cell
          const above = [v1 > level, v2 > level, v3 > level, v4 > level]
          
          // Find edge intersections
          const intersections: {x: number, y: number}[] = []
          
          if (above[0] !== above[1]) { // Top edge
            const t = (level - v1) / (v2 - v1)
            intersections.push({x: x + t, y: y})
          }
          if (above[1] !== above[2]) { // Right edge
            const t = (level - v2) / (v3 - v2)
            intersections.push({x: x + 1, y: y + t})
          }
          if (above[2] !== above[3]) { // Bottom edge
            const t = (level - v3) / (v4 - v3)
            intersections.push({x: x + t, y: y + 1})
          }
          if (above[0] !== above[3]) { // Left edge
            const t = (level - v1) / (v4 - v1)
            intersections.push({x: x, y: y + t})
          }

          // Draw line segments
          if (intersections.length >= 2) {
            ctx.moveTo(intersections[0].x * gridSize, intersections[0].y * gridSize)
            for (let i = 1; i < intersections.length; i++) {
              ctx.lineTo(intersections[i].x * gridSize, intersections[i].y * gridSize)
            }
          }
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
