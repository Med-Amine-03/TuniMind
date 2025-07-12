"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { emotions } from "@/contexts/emotion-context"
import { saveMood } from "@/lib/data-service"

export function SaveMoodModal() {
  const [open, setOpen] = useState(false)
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null)
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Listen for custom event to show the modal
    const handleShowModal = (event: CustomEvent<{ emotion: string; confidences: Record<string, number> }>) => {
      setDetectedEmotion(event.detail.emotion)
      setConfidenceScores(event.detail.confidences || {})
      setOpen(true)
    }

    window.addEventListener("showSaveMoodModal", handleShowModal as EventListener)

    return () => {
      window.removeEventListener("showSaveMoodModal", handleShowModal as EventListener)
    }
  }, [])

  const handleSaveMood = async () => {
    if (!detectedEmotion) return

    setIsSaving(true)
    try {
      // Map emotion to mood
      const emotionToMoodMap: Record<string, string> = {
        happy: "happy",
        sad: "sad",
        angry: "angry",
        surprised: "excited",
        fearful: "anxious",
        disgusted: "tired",
        neutral: "neutral",
      }

      const mood = emotionToMoodMap[detectedEmotion] || "neutral"

      // Calculate intensity based on confidence
      const intensity = Math.round(5 + (confidenceScores[detectedEmotion] || 0.5) * 5)

      // Get current date
      const today = new Date()
      const dateStr = today.toISOString().split("T")[0]

      // Save to mood tracker using the existing data service
      await saveMood({
        date: dateStr,
        mood: mood,
        intensity: intensity,
        activities: [],
        note: `Automatically detected from facial expression (${getEmotionLabel(detectedEmotion)})`,
      })

      toast({
        title: "Mood Saved",
        description: `Your ${getEmotionLabel(detectedEmotion)} mood has been saved to your tracker.`,
      })

      setOpen(false)
    } catch (error) {
      console.error("Error saving mood:", error)
      toast({
        title: "Error",
        description: "Failed to save your mood. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getEmotionLabel = (emotionId: string) => {
    const emotion = emotions.find((e) => e.id === emotionId)
    return emotion?.label || emotionId
  }

  const getEmotionEmoji = (emotionId: string) => {
    const emotion = emotions.find((e) => e.id === emotionId)
    return emotion?.emoji || "😶"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <span className="text-2xl">{detectedEmotion ? getEmotionEmoji(detectedEmotion) : "😶"}</span>
            <span>Detected Emotion: {detectedEmotion ? getEmotionLabel(detectedEmotion) : "Unknown"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center mb-4">Would you like to save this mood to your mood tracker?</p>

          {detectedEmotion && (
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium flex items-center gap-2">
                <span className="text-xl">{getEmotionEmoji(detectedEmotion)}</span>
                <span>{getEmotionLabel(detectedEmotion)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Detected with {Math.round((confidenceScores[detectedEmotion] || 0) * 100)}% confidence
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSaveMood} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save to Mood Tracker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
