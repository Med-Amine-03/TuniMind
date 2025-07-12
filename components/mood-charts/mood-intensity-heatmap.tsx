"use client"

import { useState, useMemo, useEffect } from "react"
import { format, parseISO, startOfWeek, addDays, subWeeks } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
}

type MoodIntensityHeatmapProps = {
  data: MoodData[]
}

export function MoodIntensityHeatmap({ data }: MoodIntensityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [animate, setAnimate] = useState(true)

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Process data for the heatmap
  const heatmapData = useMemo(() => {
    // Get the most recent date in the data
    if (!safeData || safeData.length === 0) {
      return []
    }

    // Make sure all dates are valid
    const validData = safeData.filter((item) => {
      try {
        new Date(item.date)
        return true
      } catch (e) {
        console.error("Invalid date:", item.date)
        return false
      }
    })

    if (validData.length === 0) {
      return []
    }

    const dates = validData.map((item) => new Date(item.date))
    const mostRecentDate = new Date(Math.max(...dates.map((d) => d.getTime())))

    // Apply week offset
    const offsetDate = subWeeks(mostRecentDate, weekOffset)

    // Start from the beginning of the week containing the offset date
    const startDate = startOfWeek(offsetDate, { weekStartsOn: 0 })

    // Initialize the grid with empty cells
    const grid = Array(7)
      .fill(0)
      .map((_, weekIndex) => {
        return Array(7)
          .fill(0)
          .map((_, dayIndex) => {
            const cellDate = addDays(startDate, -(weekIndex * 7) + dayIndex)
            return {
              date: format(cellDate, "yyyy-MM-dd"),
              displayDate: format(cellDate, "MMM d"),
              dayOfWeek: format(cellDate, "EEE"),
              value: 0,
              mood: "",
            }
          })
      })

    // Fill in the grid with actual data
    validData.forEach((item) => {
      try {
        const itemDate = parseISO(item.date)
        const dayDiff = Math.floor((offsetDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))

        // Only include data from the last 49 days (7x7 grid)
        if (dayDiff >= 0 && dayDiff < 49) {
          const weekIndex = Math.floor(dayDiff / 7)
          const dayIndex = 6 - (dayDiff % 7) // Reverse to match the grid layout

          if (weekIndex < 7 && dayIndex >= 0 && dayIndex < 7) {
            grid[weekIndex][dayIndex] = {
              ...grid[weekIndex][dayIndex],
              value: item.value,
              mood: item.mood,
            }
          }
        }
      } catch (e) {
        console.error("Error processing date:", e)
      }
    })

    return grid
  }, [safeData, weekOffset])

  // Reset animation when week changes
  useEffect(() => {
    setAnimate(false)
    const timer = setTimeout(() => setAnimate(true), 50)
    return () => clearTimeout(timer)
  }, [weekOffset])

  // If there's no data, show a message
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
        No mood data available for heatmap visualization
      </div>
    )
  }

  // Get color based on intensity value and mood
  const getColorForValue = (value: number, mood: string) => {
    // If no value, return muted color
    if (value === 0) return "bg-muted/30"

    // Find the emotion
    const emotion = emotions.find((e) => e.id === mood)

    // Default color scale if no specific emotion found
    if (!emotion) {
      if (value <= 2) return "bg-blue-100 dark:bg-blue-900/30"
      if (value <= 4) return "bg-blue-200 dark:bg-blue-800/40"
      if (value <= 6) return "bg-primary/30"
      if (value <= 8) return "bg-primary/60"
      return "bg-primary/90"
    }

    // Use emotion-specific colors with intensity
    switch (mood) {
      case "happy":
        return value <= 5
          ? "bg-gradient-to-br from-green-200 to-green-300 dark:from-green-900/40 dark:to-green-800/60"
          : "bg-gradient-to-br from-green-400 to-green-500 dark:from-green-700/70 dark:to-green-600/90"
      case "sad":
        return value <= 5
          ? "bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-900/40 dark:to-blue-800/60"
          : "bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-700/70 dark:to-blue-600/90"
      case "angry":
        return value <= 5
          ? "bg-gradient-to-br from-red-200 to-red-300 dark:from-red-900/40 dark:to-red-800/60"
          : "bg-gradient-to-br from-red-400 to-red-500 dark:from-red-700/70 dark:to-red-600/90"
      case "anxious":
        return value <= 5
          ? "bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-900/40 dark:to-amber-800/60"
          : "bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-700/70 dark:to-amber-600/90"
      case "neutral":
        return value <= 5
          ? "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800/40 dark:to-slate-700/60"
          : "bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-700/70 dark:to-slate-600/90"
      case "excited":
        return value <= 5
          ? "bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-900/40 dark:to-orange-800/60"
          : "bg-gradient-to-br from-orange-400 to-orange-500 dark:from-orange-700/70 dark:to-orange-600/90"
      case "content":
        return value <= 5
          ? "bg-gradient-to-br from-sky-200 to-sky-300 dark:from-sky-900/40 dark:to-sky-800/60"
          : "bg-gradient-to-br from-sky-400 to-sky-500 dark:from-sky-700/70 dark:to-sky-600/90"
      case "tired":
        return value <= 5
          ? "bg-gradient-to-br from-violet-200 to-violet-300 dark:from-violet-900/40 dark:to-violet-800/60"
          : "bg-gradient-to-br from-violet-400 to-violet-500 dark:from-violet-700/70 dark:to-violet-600/90"
      default:
        if (value <= 2) return "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/40"
        if (value <= 4) return "bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/40 dark:to-blue-700/50"
        if (value <= 6) return "bg-gradient-to-br from-primary/30 to-primary/40 dark:from-primary/40 dark:to-primary/50"
        if (value <= 8) return "bg-gradient-to-br from-primary/50 to-primary/60 dark:from-primary/60 dark:to-primary/70"
        return "bg-gradient-to-br from-primary/70 to-primary/90 dark:from-primary/80 dark:to-primary/90"
    }
  }

  // Days of the week for labels
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Get the date range for display
  const startDateCell = heatmapData[6][0] // Bottom left cell
  const endDateCell = heatmapData[0][6] // Top right cell
  const dateRangeText = `${startDateCell.displayDate} - ${endDateCell.displayDate}`

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(weekOffset + 1)}
          disabled={weekOffset >= 12} // Limit how far back we can go
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Older
        </Button>

        <div className="text-sm font-medium">{dateRangeText}</div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
        >
          Newer
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex mb-2">
        {daysOfWeek.map((day, index) => (
          <div key={index} className="flex-1 text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="border rounded-md p-4 bg-card flex-1">
        <AnimatePresence>
          {animate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
                  {week.map((cell, dayIndex) => {
                    const emotion = emotions.find((e) => e.id === cell.mood)

                    return (
                      <motion.div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`aspect-square rounded-sm ${getColorForValue(cell.value, cell.mood)} transition-colors relative cursor-pointer shadow-sm hover:shadow-md`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: (weekIndex * 7 + dayIndex) * 0.01,
                        }}
                        onMouseEnter={() => setHoveredCell(weekIndex * 7 + dayIndex)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {cell.value > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-xs opacity-70">
                            {emotion?.emoji}
                          </div>
                        )}

                        {hoveredCell === weekIndex * 7 + dayIndex && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-popover border rounded-md p-2 text-xs shadow-md z-10 whitespace-nowrap"
                          >
                            <div className="font-medium">{cell.displayDate}</div>
                            {cell.value > 0 ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <span>{emotion?.emoji}</span>
                                  <span className="capitalize">{emotion?.label || cell.mood}</span>
                                </div>
                                <div>Intensity: {cell.value}/10</div>
                              </>
                            ) : (
                              <div>No data</div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Less intense</div>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/40"></div>
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800/40 dark:to-blue-700/50"></div>
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-primary/30 to-primary/40 dark:from-primary/40 dark:to-primary/50"></div>
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-primary/50 to-primary/60 dark:from-primary/60 dark:to-primary/70"></div>
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-primary/70 to-primary/90 dark:from-primary/80 dark:to-primary/90"></div>
        </div>
        <div className="text-xs text-muted-foreground">More intense</div>
      </div>
    </div>
  )
}
