"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

type MoodData = {
  date: string
  mood: string
  value: number
  activities?: string[]
}

type MoodActivityCorrelationProps = {
  data: MoodData[]
}

export function MoodActivityCorrelation({ data }: MoodActivityCorrelationProps) {
  const [animateChart, setAnimateChart] = useState(false)

  // Start animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimateChart(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Define fixed sample data for the chart
  const sampleData = [
    { activity: "Exercise", avgIntensity: 7.8, emoji: "😊", label: "Happy", count: 12, color: "#4ade80" },
    { activity: "Reading", avgIntensity: 6.9, emoji: "😌", label: "Content", count: 8, color: "#60a5fa" },
    { activity: "Meditation", avgIntensity: 6.5, emoji: "😌", label: "Content", count: 7, color: "#60a5fa" },
    { activity: "Socializing", avgIntensity: 7.2, emoji: "🤩", label: "Excited", count: 9, color: "#fb923c" },
    { activity: "Creative Hobby", avgIntensity: 7.0, emoji: "😊", label: "Happy", count: 6, color: "#4ade80" },
    { activity: "Work", avgIntensity: 5.2, emoji: "😐", label: "Neutral", count: 15, color: "#94a3b8" },
    { activity: "Social Media", avgIntensity: 4.8, emoji: "😐", label: "Neutral", count: 11, color: "#94a3b8" },
    { activity: "Late Night", avgIntensity: 4.2, emoji: "😴", label: "Tired", count: 8, color: "#a78bfa" },
    { activity: "Studying", avgIntensity: 5.5, emoji: "😐", label: "Neutral", count: 10, color: "#94a3b8" },
    { activity: "Family Time", avgIntensity: 6.7, emoji: "😊", label: "Happy", count: 7, color: "#4ade80" },
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border rounded-md p-2 shadow-md">
          <div className="font-medium mb-1">{data.activity}</div>
          <div className="flex items-center gap-1 mb-1">
            <span>{data.emoji}</span>
            <span className="text-sm capitalize">{data.label}</span>
          </div>
          <div className="text-sm">Average mood: {data.avgIntensity.toFixed(1)}/10</div>
          <div className="text-xs text-muted-foreground">Entries: {data.count}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sampleData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} />
          <YAxis type="category" dataKey="activity" width={80} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 100 }} />
          <Bar
            dataKey="avgIntensity"
            isAnimationActive={animateChart}
            animationDuration={1500}
            animationEasing="ease-out"
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {sampleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
