"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
}

type MoodCircularViewProps = {
  data: MoodData[]
  size?: number
}

export function MoodCircularView({ data, size = 300 }: MoodCircularViewProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Count occurrences of each mood
  const moodCounts: Record<string, number> = {}
  safeData.forEach((item) => {
    if (item.mood) {
      moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1
    }
  })

  // Sort moods by count (descending)
  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count], index) => {
      const emotion = emotions.find((e) => e.id === mood)
      return {
        name: emotion?.label || mood,
        value: count,
        mood,
        emoji: emotion?.emoji || "😐",
        color: getColorForMood(mood),
      }
    })

  // Calculate total for percentages
  const total = sortedMoods.reduce((sum, item) => sum + item.value, 0)

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
  }, [data])

  // Draw circular chart
  useEffect(() => {
    if (!canvasRef.current || sortedMoods.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = size * 2
    canvas.height = size * 2

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate center and radius
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const outerRadius = Math.min(centerX, centerY) - 10
    const innerRadius = outerRadius * 0.6

    // Draw segments
    let startAngle = -Math.PI / 2

    sortedMoods.forEach((mood, index) => {
      const percentage = mood.value / total
      const endAngle = startAngle + 2 * Math.PI * percentage * animationProgress

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
      ctx.closePath()

      // Fill with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius)

      const isHovered = hoveredSegment === index

      gradient.addColorStop(0, isHovered ? lightenColor(mood.color, 20) : mood.color)
      gradient.addColorStop(1, isHovered ? mood.color : darkenColor(mood.color, 20))

      ctx.fillStyle = gradient
      ctx.fill()

      // Draw border
      ctx.strokeStyle = "white"
      ctx.lineWidth = isHovered ? 2 : 1
      ctx.stroke()

      // Store segment data for hover detection
      mood.startAngle = startAngle
      mood.endAngle = endAngle

      // Update start angle for next segment
      startAngle = endAngle
    })

    // Draw inner circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw text in center
    ctx.fillStyle = "hsl(var(--foreground))"
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Mood", centerX, centerY - 10)
    ctx.fillText("Distribution", centerX, centerY + 10)
  }, [sortedMoods, size, hoveredSegment, animationProgress])

  // Handle mouse move to detect hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || sortedMoods.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)

    // Calculate center and radius
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const outerRadius = Math.min(centerX, centerY) - 10
    const innerRadius = outerRadius * 0.6

    // Calculate distance from center
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))

    // Check if within ring
    if (distance >= innerRadius && distance <= outerRadius) {
      // Calculate angle
      let angle = Math.atan2(y - centerY, x - centerX)

      // Adjust angle to start from top (-PI/2)
      angle = (angle + Math.PI * 2.5) % (Math.PI * 2)

      // Find segment
      for (let i = 0; i < sortedMoods.length; i++) {
        const mood = sortedMoods[i]
        if (angle >= mood.startAngle && angle <= mood.endAngle) {
          setHoveredSegment(i)
          return
        }
      }
    } else {
      setHoveredSegment(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredSegment(null)
  }

  // If there's no data, show a message
  if (sortedMoods.length === 0) {
    // Check if this is the special user
    const isSpecialUser = localStorage.getItem("specialAccess") === "true"

    if (!isSpecialUser) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          No mood data available yet. Record your moods to see distribution analysis.
        </div>
      )
    }

    // For special user, show the default message
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No mood data available for distribution analysis
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {hoveredSegment !== null && sortedMoods[hoveredSegment] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-popover border rounded-md p-2 shadow-md z-10 text-sm"
            style={{
              left: `${size / 2}px`,
              top: `${size / 2}px`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{sortedMoods[hoveredSegment].emoji}</span>
              <span className="font-medium capitalize">{sortedMoods[hoveredSegment].name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Count: {sortedMoods[hoveredSegment].value} (
              {((sortedMoods[hoveredSegment].value / total) * 100).toFixed(1)}%)
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {sortedMoods.map((item, index) => (
          <motion.div
            key={item.mood}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs">
              {item.emoji} {item.name}
            </span>
            <span className="text-xs text-muted-foreground">({((item.value / total) * 100).toFixed(0)}%)</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Helper functions for colors
function getColorForMood(mood: string): string {
  switch (mood) {
    case "happy":
      return "#4ade80"
    case "excited":
      return "#fb923c"
    case "content":
      return "#60a5fa"
    case "neutral":
      return "#94a3b8"
    case "tired":
      return "#a78bfa"
    case "anxious":
      return "#fbbf24"
    case "sad":
      return "#38bdf8"
    case "angry":
      return "#f87171"
    default:
      return "#a1a1aa"
  }
}

function lightenColor(color: string, amount: number): string {
  return color
}

function darkenColor(color: string, amount: number): string {
  return color
}
