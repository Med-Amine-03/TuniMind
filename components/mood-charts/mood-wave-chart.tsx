"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { format, parseISO, subDays } from "date-fns"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
}

type MoodWaveChartProps = {
  data: MoodData[]
  height?: number
}

export function MoodWaveChart({ data, height = 300 }: MoodWaveChartProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })
  const [animationProgress, setAnimationProgress] = useState(0)

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Filter data based on time range
  const filteredData = safeData
    .filter((item) => {
      if (!item.date) return false
      const date = parseISO(item.date)
      const now = new Date()

      if (timeRange === "week") {
        return date >= subDays(now, 7)
      } else if (timeRange === "month") {
        return date >= subDays(now, 30)
      } else {
        return date >= subDays(now, 365)
      }
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())

  // Format data for display
  const chartData = filteredData.map((item) => ({
    ...item,
    formattedDate: format(parseISO(item.date), "MMM d"),
    emotion: emotions.find((e) => e.id === item.mood),
  }))

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
  }, [timeRange, data])

  // Draw wave chart
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate points
    const points = chartData.map((item, index) => {
      const x = (index / (chartData.length - 1 || 1)) * canvas.width
      const y = canvas.height - (item.value / 10) * (canvas.height - 40) - 20
      return { x, y, data: item }
    })

    // Draw background
    // Draw background - using fixed colors instead of CSS variables
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
        ctx.strokeStyle = "hsl(var(--primary))"
        ctx.lineWidth = 2
        ctx.fill()
        ctx.stroke()
      })
    }
  }, [chartData, dimensions, hoveredIndex, animationProgress])

  // Handle mouse move to detect hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || chartData.length === 0) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate points
    const points = chartData.map((item, index) => {
      const pointX = (index / (chartData.length - 1 || 1)) * canvas.width
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

  // Update the MoodWaveChart component to handle new users properly
  // If there's no data, use sample data only for special users
  if (chartData.length === 0) {
    // Check if this is the special user
    const isSpecialUser = localStorage.getItem("specialAccess") === "true"

    if (!isSpecialUser) {
      // For regular users with no data, show empty state
      return (
        <div className="w-full h-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                variant={timeRange === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("week")}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("month")}
              >
                Month
              </Button>
              <Button
                variant={timeRange === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("year")}
              >
                Year
              </Button>
            </div>
          </div>

          <div className="bg-muted/20 p-3 rounded-md mb-4 text-sm">
            <p>No mood data available. Add your own mood entries to see your personal data.</p>
          </div>

          <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
            Record your moods to see them visualized here
          </div>
        </div>
      )
    }

    // For special user, generate sample data
    const sampleData = generateSampleData()

    return (
      <div className="w-full h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Week
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Month
            </Button>
            <Button
              variant={timeRange === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("year")}
            >
              Year
            </Button>
          </div>
        </div>

        <div className="bg-muted/20 p-3 rounded-md mb-4 text-sm">
          <p>Showing sample data visualization. Add your own mood entries to see your personal data.</p>
        </div>

        <MoodWaveWithSampleData height={height} timeRange={timeRange} />
      </div>
    )
  }

  return (
    <div className="w-full h-full" ref={containerRef}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button variant={timeRange === "week" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("week")}>
            Week
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
          >
            Month
          </Button>
          <Button variant={timeRange === "year" ? "default" : "outline"} size="sm" onClick={() => setTimeRange("year")}>
            Year
          </Button>
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {hoveredIndex !== null && chartData[hoveredIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-popover border rounded-md p-2 shadow-md z-10 text-sm"
            style={{
              left: `${(hoveredIndex / (chartData.length - 1)) * 100}%`,
              top: `${dimensions.height - (chartData[hoveredIndex].value / 10) * (dimensions.height - 40) - 60}px`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-medium">{chartData[hoveredIndex].formattedDate}</div>
            <div className="flex items-center gap-1">
              <span>{chartData[hoveredIndex].emotion?.emoji}</span>
              <span className="capitalize">
                {chartData[hoveredIndex].emotion?.label || chartData[hoveredIndex].mood}
              </span>
            </div>
            <div>Intensity: {chartData[hoveredIndex].value}/10</div>
          </motion.div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {chartData.length > 0 && (
          <>
            <div>{chartData[0].formattedDate}</div>
            {chartData.length > 2 && <div>{chartData[Math.floor(chartData.length / 2)].formattedDate}</div>}
            <div>{chartData[chartData.length - 1].formattedDate}</div>
          </>
        )}
      </div>
    </div>
  )
}

// Add these functions at the end of the file, before the closing brace of the component
function generateSampleData() {
  const today = new Date()
  const sampleData = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    const moodValue = Math.floor(Math.random() * 10) + 1
    const moodIndex = Math.floor(Math.random() * emotions.length)
    sampleData.push({
      date: format(date, "yyyy-MM-dd"),
      mood: emotions[moodIndex].id,
      value: moodValue,
    })
  }
  return sampleData
}

interface MoodWaveWithSampleDataProps {
  height: number
  timeRange: "week" | "month" | "year"
}

function MoodWaveWithSampleData({ height, timeRange }: MoodWaveWithSampleDataProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })
  const [animationProgress, setAnimationProgress] = useState(0)

  // Generate sample data based on timeRange
  const sampleData = useMemo(() => {
    const today = new Date()
    const result = []

    // Number of data points based on time range
    const dataPoints = timeRange === "week" ? 7 : timeRange === "month" ? 14 : 24

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = subDays(today, i * (timeRange === "week" ? 1 : timeRange === "month" ? 2 : 15))

      // Create a wave pattern
      const baseValue = 5 // Middle value
      const amplitude = 3 // How much it varies
      const frequency = 0.5 // How fast it oscillates

      // Calculate a wave pattern value between 1-10
      const waveValue = baseValue + amplitude * Math.sin(frequency * i)
      const moodValue = Math.max(1, Math.min(10, Math.round(waveValue)))

      // Alternate between a few emotions
      let moodId
      if (waveValue > 7) {
        moodId = "happy"
      } else if (waveValue > 5) {
        moodId = "content"
      } else if (waveValue > 3) {
        moodId = "neutral"
      } else {
        moodId = "sad"
      }

      result.push({
        date: format(date, "yyyy-MM-dd"),
        mood: moodId,
        value: moodValue,
        formattedDate: format(date, "MMM d"),
        emotion: emotions.find((e) => e.id === moodId),
      })
    }

    return result
  }, [timeRange])

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const parent = canvas.parentElement
        if (parent) {
          setDimensions({
            width: parent.offsetWidth,
            height,
          })
        }
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
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
    return () => cancelAnimationFrame(animationFrame)
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

    // Draw background
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
  }, [sampleData, dimensions, hoveredIndex, animationProgress])

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
    <div className="relative" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="w-full h-full" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />

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
