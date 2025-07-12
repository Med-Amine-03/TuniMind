"use client"

import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

// Import the sample data generation functions
import { generateSampleMoodData, generateSampleEmotionData } from "@/lib/data-service"

export function SampleDataButton({ onComplete }: { onComplete?: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerateSampleData = async () => {
    setIsLoading(true)
    try {
      // Generate sample mood data
      const moodData = generateSampleMoodData()

      // Generate sample emotion data
      const emotionData = generateSampleEmotionData()

      // Save to localStorage
      localStorage.setItem("moods", JSON.stringify(moodData))
      localStorage.setItem("emotions", JSON.stringify(emotionData))

      toast({
        title: "Sample Data Generated",
        description: `Created ${moodData.length} mood entries and ${emotionData.length} emotion entries.`,
      })

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("Error generating sample data:", error)
      toast({
        title: "Error",
        description: "Failed to generate sample data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleGenerateSampleData}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <Database className="h-4 w-4" />
      {isLoading ? "Generating..." : "Generate Sample Data"}
    </Button>
  )
}
