"use client"

import { useState, useEffect, useRef } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { motion } from "framer-motion"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
  note?: string
  activities?: string[]
}

type MoodTimelineProps = {
  data: MoodData[]
  height?: number
}

export function MoodTimeline({ data, height = 300 }: MoodTimelineProps) {
  const [hoveredEntry, setHoveredEntry] = useState<number | null>(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height })

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Sort data by date
  const sortedData = [...safeData]
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .map((item, index) => ({
      ...item,
      formattedDate: format(parseISO(item.date), "MMM d"),
      emotion: emotions.find((e) => e.id === item.mood),
      index,
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
  }, [data])

  // If there's no data, show a message
  if (sortedData.length === 0) {
    // Check if this is the special user
    const isSpecialUser = localStorage.getItem("specialAccess") === "true"

    if (!isSpecialUser) {
      return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          No mood data available yet. Record your moods to see them on a timeline.
        </div>
      )
    }

    // For special user, show the default message
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No mood data available for timeline visualization
      </div>
    )
  }

  // Calculate positions for timeline entries
  const timelineEntries = sortedData.map((entry, index) => {
    // Calculate horizontal position based on date
    const firstDate = parseISO(sortedData[0].date)
    const lastDate = parseISO(sortedData[sortedData.length - 1].date)
    const currentDate = parseISO(entry.date)

    const totalDays = Math.max(differenceInDays(lastDate, firstDate), 1)
    const daysSinceFirst = differenceInDays(currentDate, firstDate)

    const x = (daysSinceFirst / totalDays) * (dimensions.width - 60) + 30

    // Alternate vertical position for better visibility
    const y = index % 2 === 0 ? dimensions.height / 3 : (dimensions.height * 2) / 3

    return {
      ...entry,
      x,
      y,
      radius: 20 + (entry.value / 10) * 10, // Size based on intensity
    }
  })

  return (
    <div className="w-full h-full" ref={containerRef} style={{ height: `${height}px` }}>
      <div className="relative w-full h-full">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted transform -translate-y-1/2"></div>

        {/* Timeline entries */}
        {timelineEntries.map((entry, index) => {
          const isHovered = hoveredEntry === entry.index
          const progress = Math.min(((animationProgress * (index + 1)) / timelineEntries.length) * 3, 1)

          return (
            <motion.div
              key={entry.date}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: entry.x,
                top: entry.y,
                opacity: progress,
                scale: progress,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                zIndex: isHovered ? 10 : 1,
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
              }}
              onMouseEnter={() => setHoveredEntry(entry.index)}
              onMouseLeave={() => setHoveredEntry(null)}
            >
              <div
                className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "ring-2 ring-primary" : ""
                }`}
                style={{
                  width: `${entry.radius * (isHovered ? 1.2 : 1)}px`,
                  height: `${entry.radius * (isHovered ? 1.2 : 1)}px`,
                  backgroundColor: getMoodColor(entry.mood),
                }}
              >
                <span className="text-lg">{entry.emotion?.emoji}</span>
              </div>

              {/* Date label */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-muted-foreground">
                {entry.formattedDate}
              </div>

              {/* Connector line */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 bg-muted"
                style={{
                  width: "1px",
                  height:
                    entry.y > dimensions.height / 2 ? entry.y - dimensions.height / 2 : dimensions.height / 2 - entry.y,
                  top: entry.y > dimensions.height / 2 ? "auto" : "100%",
                  bottom: entry.y > dimensions.height / 2 ? "100%" : "auto",
                }}
              ></div>

              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bg-popover border rounded-md p-2 shadow-md z-10 text-sm whitespace-nowrap"
                  style={{
                    bottom: entry.y < dimensions.height / 2 ? "calc(100% + 10px)" : "auto",
                    top: entry.y >= dimensions.height / 2 ? "calc(100% + 25px)" : "auto",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="font-medium">{format(parseISO(entry.date), "EEEE, MMMM d")}</div>
                  <div className="flex items-center gap-1">
                    <span>{entry.emotion?.emoji}</span>
                    <span className="capitalize">{entry.emotion?.label || entry.mood}</span>
                    <span className="text-muted-foreground">({entry.value}/10)</span>
                  </div>

                  {entry.activities && entry.activities.length > 0 && (
                    <div className="mt-1 text-xs">
                      <span className="text-muted-foreground">Activities: </span>
                      {entry.activities.join(", ")}
                    </div>
                  )}

                  {entry.note && (
                    <div className="mt-1 text-xs max-w-[200px] truncate">
                      <span className="text-muted-foreground">Note: </span>
                      {entry.note}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Helper function for mood colors
function getMoodColor(mood: string): string {
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
