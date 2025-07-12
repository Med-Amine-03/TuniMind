"use client"

import { useEffect } from "react"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { emotions } from "@/contexts/emotion-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"

type MoodData = {
  date: string
  mood: string
  value: number
  activities?: string[]
}

type MoodCorrelationChartProps = {
  data: MoodData[]
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const emotion = emotions.find((e) => e.id === label)
    return (
      <div className="bg-popover border rounded-md p-2 shadow-md">
        <div className="flex items-center gap-1 mb-2">
          <span>{emotion?.emoji}</span>
          <span className="font-medium capitalize">{emotion?.label || label}</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
            <span className="font-medium">{Number.parseFloat(entry.value).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Define chart colors
const chartColors = ["#7c3aed", "#94a3b8"]

export function MoodCorrelationChart({ data }: MoodCorrelationChartProps) {
  // Ensure data is valid
  const safeData = Array.isArray(data) ? data : []

  // Extract all unique activities
  const allActivities = useMemo(() => {
    const activities = new Set<string>()
    safeData.forEach((item) => {
      if (item.activities && Array.isArray(item.activities)) {
        item.activities.forEach((activity) => activities.add(activity))
      }
    })
    return Array.from(activities).sort()
  }, [safeData])

  // If no activities found, use default options
  const factorOptions = useMemo(() => {
    if (allActivities.length > 0) {
      return allActivities
    }
    return ["Exercise", "Meditation", "Social event", "Studying", "Good sleep", "Stress", "Academic pressure"]
  }, [allActivities])

  const [selectedFactor, setSelectedFactor] = useState<string>(factorOptions[0] || "Exercise")
  const [animateChart, setAnimateChart] = useState(false)

  // Calculate correlation data
  const correlationData = useMemo(() => {
    // Group data by whether it has the selected factor or not
    const withFactor: number[] = []
    const withoutFactor: number[] = []
    const withFactorMoods: Record<string, number> = {}
    const withoutFactorMoods: Record<string, number> = {}

    safeData.forEach((item) => {
      const hasSelectedFactor =
        item.activities && Array.isArray(item.activities) && item.activities.includes(selectedFactor)

      if (hasSelectedFactor) {
        withFactor.push(item.value)
        // Count moods
        withFactorMoods[item.mood] = (withFactorMoods[item.mood] || 0) + 1
      } else {
        withoutFactor.push(item.value)
        // Count moods
        withoutFactorMoods[item.mood] = (withoutFactorMoods[item.mood] || 0) + 1
      }
    })

    // Calculate averages
    const withFactorAvg = withFactor.length > 0 ? withFactor.reduce((sum, val) => sum + val, 0) / withFactor.length : 0

    const withoutFactorAvg =
      withoutFactor.length > 0 ? withoutFactor.reduce((sum, val) => sum + val, 0) / withoutFactor.length : 0

    // Find dominant mood
    const withFactorDominantMood = Object.entries(withFactorMoods).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    const withoutFactorDominantMood = Object.entries(withoutFactorMoods).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Get mood distribution for chart
    const withFactorMoodDistribution = Object.entries(withFactorMoods).map(([mood, count]) => ({
      mood,
      count,
      type: `With ${selectedFactor}`,
      percentage: withFactor.length > 0 ? (count / withFactor.length) * 100 : 0,
    }))

    const withoutFactorMoodDistribution = Object.entries(withoutFactorMoods).map(([mood, count]) => ({
      mood,
      count,
      type: `Without ${selectedFactor}`,
      percentage: withoutFactor.length > 0 ? (count / withoutFactor.length) * 100 : 0,
    }))

    // Combine all moods for chart
    const allMoods = new Set([...Object.keys(withFactorMoods), ...Object.keys(withoutFactorMoods)])
    const chartData = Array.from(allMoods)
      .map((mood) => {
        const withCount = withFactorMoods[mood] || 0
        const withoutCount = withoutFactorMoods[mood] || 0
        const withPercentage = withFactor.length > 0 ? (withCount / withFactor.length) * 100 : 0
        const withoutPercentage = withoutFactor.length > 0 ? (withoutCount / withoutFactor.length) * 100 : 0

        return {
          mood,
          [`With ${selectedFactor}`]: withPercentage,
          [`Without ${selectedFactor}`]: withoutPercentage,
          emotion: emotions.find((e) => e.id === mood),
        }
      })
      .sort((a, b) => {
        // Sort by the sum of percentages (descending)
        const sumA = a[`With ${selectedFactor}`] + a[`Without ${selectedFactor}`]
        const sumB = b[`With ${selectedFactor}`] + b[`Without ${selectedFactor}`]
        return sumB - sumA
      })

    return {
      withFactorAvg: Number.parseFloat(withFactorAvg.toFixed(1)),
      withoutFactorAvg: Number.parseFloat(withoutFactorAvg.toFixed(1)),
      withFactorCount: withFactor.length,
      withoutFactorCount: withoutFactor.length,
      difference: Number.parseFloat((withFactorAvg - withoutFactorAvg).toFixed(1)),
      withFactorDominantMood,
      withoutFactorDominantMood,
      withFactorMoods,
      withoutFactorMoods,
      chartData,
    }
  }, [safeData, selectedFactor])

  // Trigger animation when factor changes
  const handleFactorChange = (value: string) => {
    setAnimateChart(false)
    setTimeout(() => {
      setSelectedFactor(value)
      setAnimateChart(true)
    }, 300)
  }

  useEffect(() => {
    setAnimateChart(true)
  }, [])

  const maxValue = 10 // Maximum mood intensity value

  // If there's no data, show a message
  if (safeData.length === 0) {
    // Check if this is the special user
    const isSpecialUser = localStorage.getItem("specialAccess") === "true"

    if (!isSpecialUser) {
      return (
        <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
          No mood data available yet. Record moods with activities to see correlations.
        </div>
      )
    }

    // For special user, show the default message
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
        No mood data available for correlation analysis
      </div>
    )
  }

  // Get emotion details
  const getEmotionDetails = (mood: string | null) => {
    if (!mood) return { emoji: "😐", label: "Unknown" }
    const emotion = emotions.find((e) => e.id === mood)
    return {
      emoji: emotion?.emoji || "😐",
      label: emotion?.label || mood,
    }
  }

  const withFactorEmotion = getEmotionDetails(correlationData.withFactorDominantMood)
  const withoutFactorEmotion = getEmotionDetails(correlationData.withoutFactorDominantMood)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <Select value={selectedFactor} onValueChange={handleFactorChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a factor" />
          </SelectTrigger>
          <SelectContent>
            {factorOptions.map((factor) => (
              <SelectItem key={factor} value={factor}>
                {factor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Card className="p-4 border-2 overflow-hidden">
          <h3 className="text-sm font-medium mb-2">Days with {selectedFactor}</h3>
          <div className="flex items-end gap-2">
            <motion.div
              className="bg-gradient-to-t from-primary/40 to-primary rounded-t-md w-full"
              style={{
                height: `${(correlationData.withFactorAvg / maxValue) * 150}px`,
                minHeight: "20px",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(correlationData.withFactorAvg / maxValue) * 150}px` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
            <div className="text-sm font-medium">{correlationData.withFactorAvg}/10</div>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <span>{withFactorEmotion.emoji}</span>
            <span className="text-sm capitalize">{withFactorEmotion.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Based on {correlationData.withFactorCount} days</p>
        </Card>

        <Card className="p-4 border-2 overflow-hidden">
          <h3 className="text-sm font-medium mb-2">Days without {selectedFactor}</h3>
          <div className="flex items-end gap-2">
            <motion.div
              className="bg-gradient-to-t from-muted-foreground/40 to-muted-foreground rounded-t-md w-full"
              style={{
                height: `${(correlationData.withoutFactorAvg / maxValue) * 150}px`,
                minHeight: "20px",
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(correlationData.withoutFactorAvg / maxValue) * 150}px` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
            <div className="text-sm font-medium">{correlationData.withoutFactorAvg}/10</div>
          </div>
          <div className="mt-3 flex items-center gap-1">
            <span>{withoutFactorEmotion.emoji}</span>
            <span className="text-sm capitalize">{withoutFactorEmotion.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Based on {correlationData.withoutFactorCount} days</p>
        </Card>
      </div>

      <div className="flex-1 min-h-[200px]">
        <AnimatePresence>
          {animateChart && (
            <motion.div
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={correlationData.chartData}>
                  <defs>
                    <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors[1]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors[1]} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mood"
                    tickFormatter={(value) => {
                      const emotion = emotions.find((e) => e.id === value)
                      return emotion?.emoji || value
                    }}
                  />
                  <YAxis label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey={`With ${selectedFactor}`}
                    fill="url(#colorWith)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    animationBegin={0}
                  />
                  <Bar
                    dataKey={`Without ${selectedFactor}`}
                    fill="url(#colorWithout)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                    animationBegin={200}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-md">
        <h3 className="text-sm font-medium mb-1">Analysis</h3>
        {correlationData.difference > 0 ? (
          <p className="text-sm">
            Your mood tends to be{" "}
            <span className="font-medium text-primary">{correlationData.difference} points higher</span> on days with{" "}
            {selectedFactor}. {withFactorEmotion.emoji} {withFactorEmotion.label} is your most common mood on these
            days.
          </p>
        ) : correlationData.difference < 0 ? (
          <p className="text-sm">
            Your mood tends to be{" "}
            <span className="font-medium text-destructive">{Math.abs(correlationData.difference)} points lower</span> on
            days with {selectedFactor}. {withFactorEmotion.emoji} {withFactorEmotion.label} is your most common mood on
            these days.
          </p>
        ) : (
          <p className="text-sm">
            {selectedFactor} doesn't seem to have a significant impact on your mood intensity, but it may affect which
            emotions you experience.
          </p>
        )}
      </div>
    </div>
  )
}
