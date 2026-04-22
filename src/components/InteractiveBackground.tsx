'use client'

import { useEffect, useRef, useCallback } from 'react'

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number>()
  const timeRef = useRef<number>(0)
  const terrainRef = useRef<Float32Array | null>(null)
  const terrainWidth = 200
  const terrainHeight = 200

  // Generate smooth noise terrain
  const generateTerrain = useCallback((time: number) => {
    const terrain = new Float32Array(terrainWidth * terrainHeight)
    const timeFactor = time * 0.00015

    for (let y = 0; y < terrainHeight; y++) {
      for (let x = 0; x < terrainWidth; x++) {
        let height = 0
        
        // Multiple octaves of sine waves for organic terrain
        height += Math.sin(x * 0.05 + timeFactor * 2) * Math.cos(y * 0.05 + timeFactor * 1.5) * 50
        height += Math.sin(x * 0.08 - timeFactor * 1.8) * Math.sin(y * 0.06 + timeFactor * 2.2) * 35
        height += Math.cos(x * 0.03 + y * 0.04 + timeFactor * 1.2) * 45
        height += Math.sin((x + y) * 0.02 + timeFactor * 2.5) * 40
        height += Math.cos(x * 0.06 - y * 0.03 + timeFactor * 1.7) * 30
        height += Math.sin(x * 0.04 + timeFactor * 3) * Math.cos(y * 0.07 - timeFactor * 2.8) * 25
        
        terrain[y * terrainWidth + x] = height
      }
    }
    
    return terrain
  }, [])

  // Marching squares algorithm for contour lines
  const drawContourLines = useCallback((ctx: CanvasRenderingContext2D, terrain: Float32Array, width: number, height: number, elevation: number) => {
    const cellWidth = width / terrainWidth
    const cellHeight = height / terrainHeight

    ctx.beginPath()

    for (let y = 0; y < terrainHeight - 1; y++) {
      for (let x = 0; x < terrainWidth - 1; x++) {
        const idx = y * terrainWidth + x
        
        // Get values at corners
        const v1 = terrain[idx]
        const v2 = terrain[idx + 1]
        const v3 = terrain[idx + terrainWidth + 1]
        const v4 = terrain[idx + terrainWidth]

        // Check if contour passes through this cell
        const above = [v1 > elevation, v2 > elevation, v3 > elevation, v4 > elevation]
        
        // Calculate edge intersections
        const edges: number[][] = []
        
        if (above[0] !== above[1]) { // Top edge
          const t = (elevation - v1) / (v2 - v1)
          edges.push([x + t, y])
        }
        if (above[1] !== above[2]) { // Right edge
          const t = (elevation - v2) / (v3 - v2)
          edges.push([x + 1, y + t])
        }
        if (above[2] !== above[3]) { // Bottom edge
          const t = (elevation - v3) / (v4 - v3)
          edges.push([x + t, y + 1])
        }
        if (above[0] !== above[3]) { // Left edge
          const t = (elevation - v1) / (v4 - v1)
          edges.push([x, y + t])
        }

        // Draw line segments
        if (edges.length === 2) {
          ctx.moveTo(edges[0][0] * cellWidth, edges[0][1] * cellHeight)
          ctx.lineTo(edges[1][0] * cellWidth, edges[1][1] * cellHeight)
        } else if (edges.length === 4) {
          // Saddle point - connect opposite edges
          ctx.moveTo(edges[0][0] * cellWidth, edges[0][1] * cellHeight)
          ctx.lineTo(edges[2][0] * cellWidth, edges[2][1] * cellHeight)
          ctx.moveTo(edges[1][0] * cellWidth, edges[1][1] * cellHeight)
          ctx.lineTo(edges[3][0] * cellWidth, edges[3][1] * cellHeight)
        }
      }
    }

    ctx.stroke()
  }, [])

  const drawTopographicMap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)
    
    // Dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    // Generate terrain
    const terrain = generateTerrain(time)
    terrainRef.current = terrain

    // Draw contour lines at different elevations
    const contourInterval = 15
    const minElevation = -100
    const maxElevation = 100

    for (let elevation = minElevation; elevation <= maxElevation; elevation += contourInterval) {
      ctx.beginPath()
      ctx.lineWidth = 0.8
      
      // Vary line weight for index contours (every 5th line)
      const isIndexContour = elevation % (contourInterval * 5) === 0
      if (isIndexContour) {
        ctx.lineWidth = 1.5
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      }

      drawContourLines(ctx, terrain, width, height, elevation)
    }
  }, [generateTerrain, drawContourLines])

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
