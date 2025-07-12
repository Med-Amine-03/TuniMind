"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { emotions } from "@/contexts/emotion-context"

type MoodData = {
  date: string
  mood: string
  value: number
}

type MoodDistributionChartProps = {
  data: MoodData[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-popover border rounded-md p-2 shadow-md">
        <div className="flex items-center gap-1 mb-1">
          <span>{data.emoji}</span>
          <span className="font-medium capitalize">{data.label}</span>
        </div>
        <div className="text-sm">Entries: {data.value}</div>
      </div>
    )
  }
  return null
}

export function MoodDistributionChart({ data }: MoodDistributionChartProps) {
  const [animateChart, setAnimateChart] = useState(false)

  // Start animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateChart(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Count occurrences of each mood
  const moodCounts: Record<string, number> = {}
  safeData.forEach((item) => {
    if (item.mood) {
      moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1
    }
  })

  // Convert to chart data
  const chartData = Object.entries(moodCounts).map(([mood, value]) => {
    const emotion = emotions.find((e) => e.id === mood)
    return {
      name: emotion?.label || mood,
      value,
      emoji: emotion?.emoji || "😐",
      color: getColorForMood(mood),
    }
  })

  // If there's no data, show a message
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No mood data available for distribution analysis
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
        <Pie
  dataKey="value"
  isAnimationActive={animateChart}
  animationDuration={1500}
  animationEasing="ease-out"
  data={chartData}
  cx="50%"
  cy="50%"
  outerRadius={80}
  fill="#8884d8"
  label={({ percent, name }) => `${name} ${(percent * 100).toFixed(0)}%`}
>
  {chartData.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={entry.color} />
  ))}
</Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Helper function for colors
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
