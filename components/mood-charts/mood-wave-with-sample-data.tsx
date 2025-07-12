"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format, subDays } from "date-fns"
import { motion } from "framer-motion"
import { emotions } from "@/contexts/emotion-context"

type MoodWaveWithSampleDataProps = {
  height: number
  timeRange: "week" | "month" | "year"
}

export function MoodWaveWithSampleData({ height, timeRange }: MoodWaveWithSampleDataProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })
  const [animationProgress, setAnimationProgress] = useState(0)

  // Generate sample data based on time range
  const sampleData = generateSampleData(timeRange)

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height,
        })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [height])

  // Animation effect
  useEffect(() => {
    let animationFrame: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / 1500, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [timeRange])

  // Draw wave chart
  useEffect(() => {
    if (!canvasRef.current || sampleData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate points
    const points = sampleData.map((item, index) => {
      const x = (index / (sampleData.length - 1 || 1)) * canvas.width
      const y = canvas.height - (item.value / 10) * (canvas.height - 40) - 20
      return { x, y, data: item }
    })

    // Draw background - using fixed colors
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "rgba(124, 58, 237, 0.2)") // Purple color matching primary
    gradient.addColorStop(1, "rgba(124, 58, 237, 0.0)")

    // Draw wave
    if (points.length > 1) {
      // Draw filled area
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)

      // Draw curve to first point
      ctx.lineTo(points[0].x * animationProgress, points[0].y)

      // Draw curves between points
      for (let i = 0; i < points.length - 1; i++) {
        const currentPoint = points[i]
        const nextPoint = points[i + 1]

        // Only draw up to animation progress
        const currentX = currentPoint.x * animationProgress
        const nextX = nextPoint.x * animationProgress

        if (nextX > canvas.width) break

        // Control points for curve
        const cpX1 = currentPoint.x + (nextPoint.x - currentPoint.x) / 3
        const cpX2 = currentPoint.x + (2 * (nextPoint.x - currentPoint.x)) / 3

        ctx.bezierCurveTo(
          cpX1 * animationProgress,
          currentPoint.y,
          cpX2 * animationProgress,
          nextPoint.y,
          nextX,
          nextPoint.y,
        )
      }

      // Complete the path
      ctx.lineTo(canvas.width * animationProgress, canvas.height)
      ctx.closePath()

      // Fill the area
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw the curve line
      ctx.beginPath()
      ctx.moveTo(points[0].x * animationProgress, points[0].y)

      for (let i = 0; i < points.length - 1; i++) {
        const currentPoint = points[i]
        const nextPoint = points[i + 1]

        // Only draw up to animation progress
        const currentX = currentPoint.x * animationProgress
        const nextX = nextPoint.x * animationProgress

        if (nextX > canvas.width) break

        // Control points for curve
        const cpX1 = currentPoint.x + (nextPoint.x - currentPoint.x) / 3
        const cpX2 = currentPoint.x + (2 * (nextPoint.x - currentPoint.x)) / 3

        ctx.bezierCurveTo(
          cpX1 * animationProgress,
          currentPoint.y,
          cpX2 * animationProgress,
          nextPoint.y,
          nextX,
          nextPoint.y,
        )
      }

      ctx.strokeStyle = "#7c3aed" // Fixed purple color
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw points
      points.forEach((point, index) => {
        if (point.x * animationProgress > canvas.width) return

        // Draw circle
        ctx.beginPath()
        ctx.arc(point.x * animationProgress, point.y, hoveredIndex === index ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = hoveredIndex === index ? "#7c3aed" : "white"
        ctx.strokeStyle = "#7c3aed"
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
      })
    }
  }, [sampleData, dimensions, hoveredIndex, animationProgress, timeRange])

  // Handle mouse move to detect hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || sampleData.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate points
    const points = sampleData.map((item, index) => {
      const pointX = (index / (sampleData.length - 1 || 1)) * canvas.width
      const pointY = canvas.height - (item.value / 10) * (canvas.height - 40) - 20
      return { x: pointX, y: pointY, index }
    })

    // Find closest point
    let closestPoint = null
    let closestDistance = Number.POSITIVE_INFINITY

    for (const point of points) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))

      if (distance < closestDistance && distance < 20) {
        closestDistance = distance
        closestPoint = point
      }
    }

    setHoveredIndex(closestPoint ? closestPoint.index : null)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <div className="w-full h-full" ref={containerRef}>
      <div className="relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {hoveredIndex !== null && sampleData[hoveredIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-popover border rounded-md p-2 shadow-md z-10 text-sm"
            style={{
              left: `${(hoveredIndex / (sampleData.length - 1)) * 100}%`,
              top: `${dimensions.height - (sampleData[hoveredIndex].value / 10) * (dimensions.height - 40) - 60}px`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-medium">{sampleData[hoveredIndex].formattedDate}</div>
            <div className="flex items-center gap-1">
              <span>{sampleData[hoveredIndex].emotion?.emoji}</span>
              <span className="capitalize">
                {sampleData[hoveredIndex].emotion?.label || sampleData[hoveredIndex].mood}
              </span>
            </div>
            <div>Intensity: {sampleData[hoveredIndex].value}/10</div>
          </motion.div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {sampleData.length > 0 && (
          <>
            <div>{sampleData[0].formattedDate}</div>
            {sampleData.length > 2 && <div>{sampleData[Math.floor(sampleData.length / 2)].formattedDate}</div>}
            <div>{sampleData[sampleData.length - 1].formattedDate}</div>
          </>
        )}
      </div>
    </div>
  )
}

// Generate sample data
function generateSampleData(timeRange: "week" | "month" | "year" = "week") {
  const today = new Date()
  const data = []

  // Determine number of data points based on time range
  const dataPoints = timeRange === "week" ? 7 : timeRange === "month" ? 14 : 24

  // Generate data for each point
  for (let i = 0; i < dataPoints; i++) {
    // Calculate date based on time range
    let date
    if (timeRange === "week") {
      date = subDays(today, 6 - i)
    } else if (timeRange === "month") {
      date = subDays(today, 29 - i * 2)
    } else {
      date = subDays(today, 364 - i * 15)
    }

    // Generate a mood pattern that looks realistic
    // Start with neutral, then happy, then a dip, then recovery
    let moodValue
    if (i < dataPoints * 0.2) {
      moodValue = 5 + Math.sin(i) * 1.5 // Around neutral
    } else if (i < dataPoints * 0.4) {
      moodValue = 7 + Math.sin(i) * 1 // Happier
    } else if (i < dataPoints * 0.6) {
      moodValue = 4 + Math.sin(i) * 1.5 // Dip
    } else if (i < dataPoints * 0.8) {
      moodValue = 5 + Math.sin(i) * 1 // Recovery
    } else {
      moodValue = 8 + Math.sin(i) * 0.5 // End on a high note
    }

    // Ensure value is between 1 and 10
    moodValue = Math.max(1, Math.min(10, Math.round(moodValue)))

    // Determine mood based on value
    let mood
    if (moodValue >= 8) {
      mood = "happy"
    } else if (moodValue >= 6) {
      mood = "content"
    } else if (moodValue >= 4) {
      mood = "neutral"
    } else if (moodValue >= 2) {
      mood = "sad"
    } else {
      mood = "angry"
    }

    data.push({
      date: format(date, "yyyy-MM-dd"),
      formattedDate: format(date, "MMM d"),
      mood,
      value: moodValue,
      emotion: emotions.find((e) => e.id === mood),
    })
  }

  return data
}
