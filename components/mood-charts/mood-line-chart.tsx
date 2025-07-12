"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
  activities?: string[]
}

type MoodLineChartProps = {
  data: MoodData[]
}

// Enhanced CustomTooltip component with better styling and more information
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{data.emotion?.emoji}</span>
          <span className="font-medium text-base capitalize">{data.emotion?.label || data.mood}</span>
        </div>
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-sm text-muted-foreground">{format(new Date(data.originalDate), "MMM d, yyyy")}</span>
          <span className="font-medium">{data.value}/10</span>
        </div>
        {data.activities && data.activities.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Activities:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.activities.map((activity: string, i: number) => (
                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function MoodLineChart({ data }: MoodLineChartProps) {
  const [animateChart, setAnimateChart] = useState(false)

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Generate activities data if none exists in the real data
  const enhancedData = safeData.map((entry) => {
    if (entry.activities && entry.activities.length > 0) {
      return entry
    }

    // Add activities based on mood and value
    const activities = generateActivitiesForMood(entry.mood, entry.value)
    return {
      ...entry,
      activities,
    }
  })

  // Sort data by date
  const sortedData = [...enhancedData].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Update the chartData mapping to include emotion information
  const chartData = sortedData.map((item) => ({
    date: format(parseISO(item.date), "MMM d"),
    value: item.value,
    mood: item.mood,
    activities: item.activities,
    emotion: emotions.find((e) => e.id === item.mood),
    // Add original date for tooltip
    originalDate: item.date,
  }))

  // Start animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateChart(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // If there's no data, use sample data
  if (chartData.length === 0) {
    // Generate sample data
    const sampleData = generateSampleLineData()

    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sampleData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <ChartTooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 100 }}
              cursor={{ stroke: "#ddd", strokeWidth: 1, strokeDasharray: "5 5" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{ r: 4, fill: "#7c3aed" }}
              activeDot={{ r: 8, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} />
          <ChartTooltip
            content={<CustomTooltip />}
            wrapperStyle={{ zIndex: 100 }}
            cursor={{ stroke: "#ddd", strokeWidth: 1, strokeDasharray: "5 5" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#colorValue)"
            dot={{ r: 4, fill: "#7c3aed" }}
            activeDot={{ r: 8, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={animateChart}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Function to generate sample line chart data
function generateSampleLineData() {
  const result = []
  const months = ["Jan", "Feb", "Mar", "Apr", "May"]
  const sampleActivities = [
    ["Exercise", "Reading"],
    ["Meditation", "Work"],
    ["Social Media", "Family Time"],
    ["Studying", "Creative Hobby"],
    ["Socializing", "Late Night"],
  ]

  // Create a wave pattern
  for (let i = 0; i < 30; i++) {
    const day = i + 1
    const monthIndex = Math.floor(i / 6) % months.length
    const date = `${months[monthIndex]} ${(day % 30) + 1}`

    // Create a wave pattern
    const phase = (i / 30) * Math.PI * 2
    const baseValue = 5 // Middle value
    const amplitude = 3 // How much it varies

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
    if (i % 7 === 0) mood = "excited"
    if (i % 11 === 0) mood = "anxious"
    if (i % 13 === 0) mood = "angry"

    // Add sample activities
    const activityIndex = i % sampleActivities.length
    const activities = sampleActivities[activityIndex]

    // Create a date string for the past 30 days
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - (30 - i))
    const originalDate = pastDate.toISOString().split("T")[0]

    result.push({
      date,
      value,
      mood,
      activities,
      emotion: emotions.find((e) => e.id === mood),
      originalDate,
    })
  }

  return result
}

// Helper function to generate activities based on mood and value
function generateActivitiesForMood(mood: string, value: number): string[] {
  const activityMap: Record<string, string[]> = {
    happy: ["Exercise", "Socializing", "Creative Hobby", "Family Time", "Outdoor Activities"],
    excited: ["Socializing", "Travel", "Entertainment", "Sports", "Shopping"],
    content: ["Reading", "Meditation", "Cooking", "Gardening", "Music"],
    neutral: ["Work", "Studying", "Commuting", "Household Chores", "TV Watching"],
    tired: ["Late Night", "Overtime Work", "Long Commute", "Physical Labor", "Illness"],
    anxious: ["Deadlines", "Public Speaking", "Conflict", "Financial Stress", "Health Concerns"],
    sad: ["Isolation", "Bad News", "Rainy Weather", "Disappointment", "Loss"],
    angry: ["Conflict", "Traffic", "Technical Issues", "Unfairness", "Interruptions"],
  }

  const defaultActivities = ["Daily Routine", "Work", "Rest"]
  const moodActivities = activityMap[mood] || defaultActivities

  // Select 1-3 activities based on the mood
  const numActivities = Math.floor(Math.random() * 2) + 1 // 1-2 activities
  const selectedActivities = []

  // Always include the first activity for this mood
  selectedActivities.push(moodActivities[0])

  // Add additional random activities
  for (let i = 1; i < numActivities && i < moodActivities.length; i++) {
    const randomIndex = Math.floor(Math.random() * (moodActivities.length - 1)) + 1
    if (!selectedActivities.includes(moodActivities[randomIndex])) {
      selectedActivities.push(moodActivities[randomIndex])
    }
  }

  return selectedActivities
}
