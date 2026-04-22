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

    // Draw contour lines using marching squares avec cases correctes
    const contourLevels = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    
    for (const level of contourLevels) {
      const isMajor = level % 40 === 0
      ctx.lineWidth = isMajor ? 1.2 : 0.8
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.10)'

      // Commencer un seul path pour tout ce niveau (optimisation)
      ctx.beginPath()

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const v1 = terrain[y][x]
          const v2 = terrain[y][x + 1]
          const v3 = terrain[y + 1][x + 1]
          const v4 = terrain[y + 1][x]

          // Déterminer quels sommets sont au-dessus du niveau
          const above = [v1 > level, v2 > level, v3 > level, v4 > level]
          
          // Calculer l'index du cas (0-15)
          const caseIndex = (above[0] ? 8 : 0) | (above[1] ? 4 : 0) | (above[2] ? 2 : 0) | (above[3] ? 1 : 0)
          
          if (caseIndex === 0 || caseIndex === 15) continue // Pas de contour ou cellule pleine

          // Calculer les points d'intersection sur les arêtes
          const topX = x + (level - v1) / (v2 - v1 + 0.001)
          const bottomX = x + (level - v4) / (v3 - v4 + 0.001)
          const leftY = y + (level - v1) / (v4 - v1 + 0.001)
          const rightY = y + (level - v2) / (v3 - v2 + 0.001)
          
          // Dessiner selon le cas avec la bonne orientation
          switch (caseIndex) {
            case 1: case 14: // Gauche -> Bas
              ctx.moveTo(x * gridSize, leftY * gridSize)
              ctx.lineTo(bottomX * gridSize, (y + 1) * gridSize)
              break
            case 2: case 13: // Bas -> Droite
              ctx.moveTo(bottomX * gridSize, (y + 1) * gridSize)
              ctx.lineTo((x + 1) * gridSize, rightY * gridSize)
              break
            case 3: case 12: // Gauche -> Droite
              ctx.moveTo(x * gridSize, leftY * gridSize)
              ctx.lineTo((x + 1) * gridSize, rightY * gridSize)
              break
            case 4: case 11: // Haut -> Droite
              ctx.moveTo(topX * gridSize, y * gridSize)
              ctx.lineTo((x + 1) * gridSize, rightY * gridSize)
              break
            case 5: // Gauche -> Haut ET Bas -> Droite (deux lignes)
              ctx.moveTo(x * gridSize, leftY * gridSize)
              ctx.lineTo(topX * gridSize, y * gridSize)
              ctx.moveTo(bottomX * gridSize, (y + 1) * gridSize)
              ctx.lineTo((x + 1) * gridSize, rightY * gridSize)
              break
            case 6: case 9: // Haut -> Bas
              ctx.moveTo(topX * gridSize, y * gridSize)
              ctx.lineTo(bottomX * gridSize, (y + 1) * gridSize)
              break
            case 7: case 8: // Gauche -> Haut
              ctx.moveTo(x * gridSize, leftY * gridSize)
              ctx.lineTo(topX * gridSize, y * gridSize)
              break
            case 10: // Haut -> Droite ET Gauche -> Bas (deux lignes)
              ctx.moveTo(topX * gridSize, y * gridSize)
              ctx.lineTo((x + 1) * gridSize, rightY * gridSize)
              ctx.moveTo(x * gridSize, leftY * gridSize)
              ctx.lineTo(bottomX * gridSize, (y + 1) * gridSize)
              break
          }
        }
      }

      // Un seul stroke pour tout le niveau (beaucoup plus rapide)
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
