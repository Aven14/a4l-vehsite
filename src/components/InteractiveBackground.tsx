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

    const timeSpeed = 0.0002 // Faster animation
    const gridSize = 10 // Smaller grid for smoother lines
    const cols = Math.floor(width / gridSize) + 1
    const rows = Math.floor(height / gridSize) + 1

    // Generate terrain height map with smooth organic movement
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

    // Helper to get interpolated position on grid edges
    const getInterpolation = (v1: number, v2: number, level: number): number => {
      if (Math.abs(v2 - v1) < 0.001) return 0.5
      return Math.max(0, Math.min(1, (level - v1) / (v2 - v1)))
    }

    // Draw contour lines by tracing continuous paths
    const contourLevels = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100]
    const visited = new Set<string>()
    
    for (const level of contourLevels) {
      ctx.lineWidth = level % 40 === 0 ? 1.8 : 1.2
      ctx.strokeStyle = level % 40 === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'
      
      // Clear visited for this level
      visited.clear()
      
      // Trace contours
      for (let startY = 0; startY < rows - 1; startY++) {
        for (let startX = 0; startX < cols - 1; startX++) {
          const key = `${startX},${startY}`
          if (visited.has(key)) continue
          
          const v1 = terrain[startY][startX]
          const v2 = terrain[startY][startX + 1]
          const v3 = terrain[startY + 1][startX + 1]
          const v4 = terrain[startY + 1][startX]

          const above = [v1 > level, v2 > level, v3 > level, v4 > level]
          const caseIndex = (above[0] ? 8 : 0) | (above[1] ? 4 : 0) | (above[2] ? 2 : 0) | (above[3] ? 1 : 0)
          
          if (caseIndex === 0 || caseIndex === 15) {
            visited.add(key)
            continue
          }

          // Start tracing a continuous path
          ctx.beginPath()
          let cx = startX
          let cy = startY
          let prevX: number | null = null
          let prevY: number | null = null
          let pathLength = 0
          const maxPathLength = 1000 // Prevent infinite loops
          
          while (pathLength < maxPathLength) {
            if (cx < 0 || cx >= cols - 1 || cy < 0 || cy >= rows - 1) break
            
            const ck = `${cx},${cy}`
            if (visited.has(ck) && pathLength > 0) break
            visited.add(ck)
            
            const cv1 = terrain[cy][cx]
            const cv2 = terrain[cy][cx + 1]
            const cv3 = terrain[cy + 1][cx + 1]
            const cv4 = terrain[cy + 1][cx]

            const cAbove = [cv1 > level, cv2 > level, cv3 > level, cv4 > level]
            const cCase = (cAbove[0] ? 8 : 0) | (cAbove[1] ? 4 : 0) | (cAbove[2] ? 2 : 0) | (cAbove[3] ? 1 : 0)
            
            if (cCase === 0 || cCase === 15) break

            // Get intersection points for current cell
            const intersections: {x: number, y: number, edge: number}[] = []
            
            // Top edge (edge 0)
            const tTop = getInterpolation(cv1, cv2, level)
            intersections.push({x: cx + tTop, y: cy, edge: 0})
            // Right edge (edge 1)
            const tRight = getInterpolation(cv2, cv3, level)
            intersections.push({x: cx + 1, y: cy + tRight, edge: 1})
            // Bottom edge (edge 2)
            const tBottom = getInterpolation(cv3, cv4, level)
            intersections.push({x: cx + tBottom, y: cy + 1, edge: 2})
            // Left edge (edge 3)
            const tLeft = getInterpolation(cv4, cv1, level)
            intersections.push({x: cx, y: cy + tLeft, edge: 3})
            
            // Filter actual crossings
            const crossings: {x: number, y: number, edge: number}[] = []
            if ((cAbove[0] !== cAbove[1])) crossings.push(intersections[0]) // Top
            if ((cAbove[1] !== cAbove[2])) crossings.push(intersections[1]) // Right
            if ((cAbove[2] !== cAbove[3])) crossings.push(intersections[2]) // Bottom
            if ((cAbove[3] !== cAbove[0])) crossings.push(intersections[3]) // Left
            
            if (crossings.length < 2) break
            
            // Find entry and exit points
            let entry: {x: number, y: number}
            let exit: {x: number, y: number}
            
            if (pathLength === 0) {
              // Starting point - use first intersection
              entry = {x: crossings[0].x, y: crossings[0].y}
              exit = {x: crossings[1].x, y: crossings[1].y}
              prevX = cx
              prevY = cy
            } else {
              // Find which intersection is closest to previous position
              let minDist = Infinity
              let entryIdx = 0
              
              for (let i = 0; i < crossings.length; i++) {
                const dist = Math.abs(crossings[i].x - (prevX || cx)) + Math.abs(crossings[i].y - (prevY || cy))
                if (dist < minDist) {
                  minDist = dist
                  entryIdx = i
                }
              }
              
              entry = {x: crossings[entryIdx].x, y: crossings[entryIdx].y}
              exit = crossings.find((_, idx) => idx !== entryIdx) || crossings[(entryIdx + 1) % crossings.length]
            }
            
            // Draw segment
            if (pathLength === 0) {
              ctx.moveTo(entry.x * gridSize, entry.y * gridSize)
            }
            ctx.lineTo(exit.x * gridSize, exit.y * gridSize)
            
            // Move to next cell
            const exitEdge = crossings.findIndex(c => Math.abs(c.x - exit.x) < 0.01 && Math.abs(c.y - exit.y) < 0.01)
            
            // Determine next cell based on exit edge
            if (exitEdge === 0) { cy -= 1 } // Top
            else if (exitEdge === 1) { cx += 1 } // Right
            else if (exitEdge === 2) { cy += 1 } // Bottom
            else if (exitEdge === 3) { cx -= 1 } // Left
            
            prevX = cx
            prevY = cy
            pathLength++
          }
          
          ctx.stroke()
        }
      }
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
