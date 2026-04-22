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

    const timeSpeed = 0.0002
    const gridSize = 5 // Much smaller grid for invisible segments
    const cols = Math.floor(width / gridSize) + 1
    const rows = Math.floor(height / gridSize) + 1

    // Generate terrain height map
    const terrain: number[][] = []
    
    for (let y = 0; y < rows; y++) {
      terrain[y] = []
      for (let x = 0; x < cols; x++) {
        let h = 0
        
        // Layer 1: Large slow-moving features
        h += Math.sin(x * 0.05 + time * timeSpeed * 1.5) * Math.cos(y * 0.04 + time * timeSpeed * 1.2) * 80
        // Layer 2: Medium features
        h += Math.sin(x * 0.08 - time * timeSpeed * 2) * Math.cos(y * 0.07 + time * timeSpeed * 1.8) * 50
        // Layer 3: Small fast features
        h += Math.cos(x * 0.12 + y * 0.1 + time * timeSpeed * 2.5) * 30
        // Layer 4: Diagonal features
        h += Math.sin((x + y) * 0.06 + time * timeSpeed * 1.7) * 40
        // Layer 5: Fine detail
        h += Math.cos(x * 0.15 - y * 0.12 + time * timeSpeed * 3) * 20
        
        terrain[y][x] = h
      }
    }

    // Draw contour lines with simple marching squares
    const contourLevels = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]
    
    for (const level of contourLevels) {
      ctx.lineWidth = level % 40 === 0 ? 1.8 : 1.2
      ctx.strokeStyle = level % 40 === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'
      
      ctx.beginPath()

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const v1 = terrain[y][x]
          const v2 = terrain[y][x + 1]
          const v3 = terrain[y + 1][x + 1]
          const v4 = terrain[y + 1][x]

          const above = [v1 > level, v2 > level, v3 > level, v4 > level]
          
          // Find edge intersections
          const intersections: {x: number, y: number}[] = []
          
          // Top edge
          if (above[0] !== above[1]) {
            const t = (level - v1) / (v2 - v1 + 0.001)
            intersections.push({x: (x + t) * gridSize, y: y * gridSize})
          }
          // Right edge
          if (above[1] !== above[2]) {
            const t = (level - v2) / (v3 - v2 + 0.001)
            intersections.push({x: (x + 1) * gridSize, y: (y + t) * gridSize})
          }
          // Bottom edge
          if (above[2] !== above[3]) {
            const t = (level - v3) / (v4 - v3 + 0.001)
            intersections.push({x: (x + t) * gridSize, y: (y + 1) * gridSize})
          }
          // Left edge
          if (above[0] !== above[3]) {
            const t = (level - v1) / (v4 - v1 + 0.001)
            intersections.push({x: x * gridSize, y: (y + t) * gridSize})
          }

          // Draw line if we have intersections
          if (intersections.length >= 2) {
            ctx.moveTo(intersections[0].x, intersections[0].y)
            ctx.lineTo(intersections[1].x, intersections[1].y)
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
