'use client'

import { useEffect, useRef, useCallback } from 'react'

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number>()
  const timeRef = useRef<number>(0)

  // Simple noise function for organic terrain
  const noise2D = useCallback((x: number, y: number, time: number): number => {
    const sin1 = Math.sin(x * 0.01 + time * 0.0002) * Math.cos(y * 0.01 + time * 0.00015)
    const sin2 = Math.sin(x * 0.02 - time * 0.0003) * Math.sin(y * 0.015 + time * 0.00025)
    const cos1 = Math.cos(x * 0.005 + y * 0.005 + time * 0.0001)
    const cos2 = Math.cos(x * 0.008 - y * 0.006 + time * 0.00018)
    
    return (sin1 + sin2 + cos1 + cos2) / 4
  }, [])

  const drawTopographicMap = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height)
    
    // Dark background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, width, height)

    const contourInterval = 25
    const numContours = 40
    const resolution = 8

    // Define moving terrain peaks
    const peaks = [
      { x: width * 0.2, y: height * 0.3, baseHeight: 100, moveRadius: 80, speed: 0.0002 },
      { x: width * 0.7, y: height * 0.6, baseHeight: 120, moveRadius: 100, speed: 0.00025 },
      { x: width * 0.5, y: height * 0.8, baseHeight: 90, moveRadius: 70, speed: 0.00015 },
      { x: width * 0.85, y: height * 0.2, baseHeight: 110, moveRadius: 90, speed: 0.0003 },
      { x: width * 0.3, y: height * 0.7, baseHeight: 95, moveRadius: 85, speed: 0.00022 },
    ]

    // Draw contour lines using marching squares-like approach
    for (let contour = 0; contour < numContours; contour++) {
      const elevation = contour * contourInterval

      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 0.8

      // Sample the terrain and draw contour lines
      for (let y = 0; y < height - resolution; y += resolution) {
        for (let x = 0; x < width - resolution; x += resolution) {
          // Calculate terrain height at this point
          let terrainHeight = 0
          
          for (const peak of peaks) {
            const peakX = peak.x + Math.sin(time * peak.speed + peak.x * 0.001) * peak.moveRadius
            const peakY = peak.y + Math.cos(time * peak.speed * 0.8 + peak.y * 0.001) * peak.moveRadius
            
            const dx = x - peakX
            const dy = y - peakY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            // Gaussian influence from each peak
            const influence = peak.baseHeight * Math.exp(-(distance * distance) / (2 * 150 * 150))
            terrainHeight += influence
          }

          // Add noise for organic feel
          terrainHeight += noise2D(x, y, time) * 30

          // Check if this cell crosses the contour level
          const corners = [
            noise2D(x, y, time) + terrainHeight,
            noise2D(x + resolution, y, time) + terrainHeight,
            noise2D(x + resolution, y + resolution, time) + terrainHeight,
            noise2D(x, y + resolution, time) + terrainHeight,
          ]

          // Simplified contour drawing - draw lines where contour crosses
          const checkCrossing = (i: number, j: number, h1: number, h2: number) => {
            if ((h1 - elevation) * (h2 - elevation) < 0) {
              const t = (elevation - h1) / (h2 - h1)
              const px = i === 0 ? x : x + resolution
              const py = j === 0 ? y : y + resolution
              const crossX = i === 0 ? x + t * resolution : x + (j === 0 ? t * resolution : 0)
              const crossY = j === 0 ? y : y + resolution
              return { x: crossX, y: crossY }
            }
            return null
          }

          // Draw contour segments
          const terrainH = terrainHeight
          const h1 = corners[0]
          const h2 = corners[1]
          const h3 = corners[2]
          const h4 = corners[3]

          if ((h1 - elevation) * (h2 - elevation) < 0 || (h2 - elevation) * (h3 - elevation) < 0 ||
              (h3 - elevation) * (h4 - elevation) < 0 || (h4 - elevation) * (h1 - elevation) < 0) {
            
            const centerX = x + resolution / 2
            const centerY = y + resolution / 2
            
            if (x === 0 && y === 0) {
              ctx.moveTo(centerX, centerY)
            } else {
              ctx.lineTo(centerX, centerY)
            }
          }
        }
      }

      // Vary opacity based on contour level
      const alpha = 0.08 + Math.sin(contour * 0.3 + time * 0.0001) * 0.04
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.stroke()
    }

    // Draw radial contour lines around each peak for classic topographic look
    for (const peak of peaks) {
      const peakX = peak.x + Math.sin(time * peak.speed) * peak.moveRadius
      const peakY = peak.y + Math.cos(time * peak.speed * 0.8) * peak.moveRadius
      const numRings = 12
      const maxRadius = 180

      for (let ring = 1; ring <= numRings; ring++) {
        const radius = (ring / numRings) * maxRadius
        
        ctx.beginPath()
        
        for (let angle = 0; angle <= Math.PI * 2; angle += 0.08) {
          // Organic distortion
          const distortion = 
            Math.sin(angle * 3 + time * 0.0003 + peak.x * 0.001) * 20 +
            Math.cos(angle * 5 + time * 0.0002) * 15 +
            Math.sin(angle * 2 + time * 0.0004 + peak.y * 0.001) * 25 +
            noise2D(
              peakX + Math.cos(angle) * radius,
              peakY + Math.sin(angle) * radius,
              time
            ) * 30

          const r = radius + distortion
          const x = peakX + Math.cos(angle) * r
          const y = peakY + Math.sin(angle) * r

          if (angle === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        const alpha = 0.15 - (ring / numRings) * 0.08
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.lineWidth = 1.2 - (ring / numRings) * 0.5
        ctx.stroke()
      }

      // Add peak marker
      ctx.beginPath()
      ctx.arc(peakX, peakY, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fill()
    }
  }, [noise2D])

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
