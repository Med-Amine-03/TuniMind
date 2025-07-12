"use client"

import { useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
  note?: string
  activities?: string[]
}

type MoodCalendarViewProps = {
  data: MoodData[]
}

export function MoodCalendarView({ data }: MoodCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [animate, setAnimate] = useState(true)

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Get days for the current month
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentDate])

  // Get mood data for each day
  const calendarData = useMemo(() => {
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayData = safeData.find((item) => {
        try {
          return isSameDay(parseISO(item.date), day)
        } catch (e) {
          return false
        }
      })

      return {
        date: day,
        formattedDate: format(day, "d"),
        mood: dayData?.mood || "",
        value: dayData?.value || 0,
        note: dayData?.note || "",
        activities: dayData?.activities || [],
        hasData: !!dayData,
        isCurrentMonth: day.getMonth() === currentDate.getMonth(),
      }
    })
  }, [days, safeData, currentDate])

  // Navigate to previous month
  const prevMonth = () => {
    setAnimate(false)
    setTimeout(() => {
      setCurrentDate(subMonths(currentDate, 1))
      setAnimate(true)
    }, 200)
  }

  // Navigate to next month
  const nextMonth = () => {
    setAnimate(false)
    setTimeout(() => {
      setCurrentDate(addMonths(currentDate, 1))
      setAnimate(true)
    }, 200)
  }

  // Get color for mood
  const getMoodColor = (mood: string, value: number) => {
    if (!mood) return "bg-muted/30"

    // Find the emotion
    const emotion = emotions.find((e) => e.id === mood)

    // Default color if no specific emotion found
    if (!emotion) {
      return "bg-primary/40"
    }

    // Use emotion-specific colors with intensity
    switch (mood) {
      case "happy":
        return value <= 5 ? "bg-green-200 dark:bg-green-900/40" : "bg-green-400 dark:bg-green-700/70"
      case "sad":
        return value <= 5 ? "bg-blue-200 dark:bg-blue-900/40" : "bg-blue-400 dark:bg-blue-700/70"
      case "angry":
        return value <= 5 ? "bg-red-200 dark:bg-red-900/40" : "bg-red-400 dark:bg-red-700/70"
      case "anxious":
        return value <= 5 ? "bg-amber-200 dark:bg-amber-900/40" : "bg-amber-400 dark:bg-amber-700/70"
      case "neutral":
        return value <= 5 ? "bg-slate-200 dark:bg-slate-800/40" : "bg-slate-400 dark:bg-slate-700/70"
      case "excited":
        return value <= 5 ? "bg-orange-200 dark:bg-orange-900/40" : "bg-orange-400 dark:bg-orange-700/70"
      case "content":
        return value <= 5 ? "bg-sky-200 dark:bg-sky-900/40" : "bg-sky-400 dark:bg-sky-700/70"
      case "tired":
        return value <= 5 ? "bg-violet-200 dark:bg-violet-900/40" : "bg-violet-400 dark:bg-violet-700/70"
      default:
        return "bg-primary/40"
    }
  }

  // Get selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null

    return calendarData.find((day) => isSameDay(day.date, selectedDay))
  }, [selectedDay, calendarData])

  // Days of the week
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // If no data, generate sample data
  const hasSampleData = safeData.length === 0
  const sampleData = useMemo(() => {
    if (!hasSampleData) return []

    const today = new Date()
    const result = []
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysInMonth = monthEnd.getDate()

    // Create a pattern of moods throughout the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Skip some days to make it look more realistic
      if (day % 3 === 0) continue

      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

      // Skip if date is in the future
      if (date > today) continue

      // Create a wave pattern for the month
      const phase = (day / daysInMonth) * Math.PI * 2
      const baseValue = 5 // Middle value
      const amplitude = 4 // How much it varies

      // Calculate a wave pattern value between 1-10
      const waveValue = baseValue + amplitude * Math.sin(phase)
      const value = Math.max(1, Math.min(10, Math.round(waveValue)))

      // Assign mood based on the value
      let mood
      if (value >= 8) {
        mood = "happy"
      } else if (value >= 6) {
        mood = "content"
      } else if (value >= 5) {
        mood = "neutral"
      } else if (value >= 3) {
        mood = "tired"
      } else {
        mood = "sad"
      }

      // Add some variety with other emotions occasionally
      if (day % 7 === 0) mood = "excited"
      if (day % 11 === 0) mood = "anxious"
      if (day % 13 === 0) mood = "angry"

      // Create sample activities based on the mood
      const activities = []
      if (["happy", "excited", "content"].includes(mood)) {
        activities.push("Exercise")
        if (day % 2 === 0) activities.push("Social activity")
      }
      if (["sad", "anxious", "angry"].includes(mood)) {
        activities.push("Meditation")
        if (day % 2 === 0) activities.push("Journaling")
      }
      if (["neutral", "tired"].includes(mood)) {
        activities.push("Reading")
        if (day % 2 === 0) activities.push("Relaxing")
      }

      // Add a note based on the mood
      let note = ""
      switch (mood) {
        case "happy":
          note = "Had a great day today! Feeling energetic and positive."
          break
        case "sad":
          note = "Feeling down today. Need to focus on self-care."
          break
        case "angry":
          note = "Frustrated with work situation. Need to practice patience."
          break
        case "anxious":
          note = "Feeling worried about upcoming deadlines."
          break
        case "neutral":
          note = "Average day, nothing special to report."
          break
        case "excited":
          note = "Looking forward to the weekend plans!"
          break
        case "content":
          note = "Peaceful day. Enjoyed the little things."
          break
        case "tired":
          note = "Low energy today. Need more rest."
          break
      }

      result.push({
        date: format(date, "yyyy-MM-dd"),
        mood,
        value,
        note,
        activities,
      })
    }

    return result
  }, [hasSampleData, currentDate])

  // Combine real data with sample data if needed
  const displayData = hasSampleData ? sampleData : safeData

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <Button variant="outline" size="sm" onClick={prevMonth} className="h-8 px-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
  
        <h3 className="text-base font-medium">{format(currentDate, "MMMM yyyy")}</h3>
  
        <Button variant="outline" size="sm" onClick={nextMonth} className="h-8 px-2">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
  
      {hasSampleData && (
        <div className="bg-muted/20 p-2 rounded-md mb-2 text-xs">
          <p>Showing sample data. Add your own mood entries to see your personal data.</p>
        </div>
      )}
  
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
  
      {/* Here: make it scrollable */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {animate && (
            <motion.div
              className="grid grid-cols-7 gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {calendarData.map((day, index) => {
                const dayData = displayData.find((d) => {
                  try {
                    return isSameDay(parseISO(d.date), day.date)
                  } catch (e) {
                    return false
                  }
                })
  
                const hasData = !!dayData
                const mood = dayData?.mood || ""
                const value = dayData?.value || 0
  
                return (
                  <motion.div
                    key={day.formattedDate + index}
                    className={`h-10 rounded-md relative cursor-pointer border ${
                      hasData ? getMoodColor(mood, value) : day.isCurrentMonth ? "bg-muted/10" : "bg-transparent"
                    } ${!day.isCurrentMonth ? "opacity-40" : ""} ${
                      selectedDay && isSameDay(day.date, selectedDay) ? "ring-2 ring-primary" : ""
                    }`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.01, duration: 0.2 }}
                    onClick={() => setSelectedDay(day.date)}
                  >
                    <div className="absolute top-1 left-1 text-xs font-medium">{day.formattedDate}</div>
  
                    {hasData && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base">{emotions.find((e) => e.id === mood)?.emoji || ""}</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Selected day details */}
        {selectedDay && (
          <motion.div
            className="mt-3 p-3 border rounded-md text-sm bg-background"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-medium mb-2 text-sm">{format(selectedDay, "EEEE, MMMM d, yyyy")}</h3>
  
            {selectedDayData?.hasData ||
            displayData.some((d) => {
              try {
                return isSameDay(parseISO(d.date), selectedDay)
              } catch (e) {
                return false
              }
            }) ? (
              <div className="space-y-2">
                {(() => {
                  const dayData = displayData.find((d) => {
                    try {
                      return isSameDay(parseISO(d.date), selectedDay)
                    } catch (e) {
                      return false
                    }
                  })
  
                  if (!dayData) return null
  
                  const emotion = emotions.find((e) => e.id === dayData.mood)
  
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span>{emotion?.emoji || ""}</span>
                        <span className="font-medium capitalize">{emotion?.label || dayData.mood}</span>
                        <span className="text-xs text-muted-foreground">(Intensity: {dayData.value}/10)</span>
                      </div>
  
                      {dayData.activities && dayData.activities.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Activities:</p>
                          <div className="flex flex-wrap gap-2">
                            {dayData.activities.map((activity, i) => (
                              <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
  
                      {dayData.note && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Notes:</p>
                          <div className="text-xs bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                            {dayData.note}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No mood data recorded for this day.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
  
}
