"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

// Sample emotion data
export const emotions = [
  {
    id: "happy",
    emoji: "😊",
    label: "Happy",
    color: "bg-green-500",
    description: "You're feeling joyful and content.",
  },
  {
    id: "sad",
    emoji: "😢",
    label: "Sad",
    color: "bg-blue-500",
    description: "You're experiencing feelings of sadness or grief.",
  },
  {
    id: "angry",
    emoji: "😠",
    label: "Angry",
    color: "bg-red-500",
    description: "You're feeling frustrated or irritated.",
  },
  {
    id: "surprised",
    emoji: "😲",
    label: "Surprised",
    color: "bg-yellow-500",
    description: "You're experiencing unexpected feelings.",
  },
  {
    id: "fearful",
    emoji: "😨",
    label: "Fearful",
    color: "bg-purple-500",
    description: "You're feeling anxious or afraid.",
  },
  {
    id: "disgusted",
    emoji: "🤢",
    label: "Disgusted",
    color: "bg-emerald-500",
    description: "You're feeling aversion or revulsion.",
  },
  {
    id: "neutral",
    emoji: "😐",
    label: "Neutral",
    color: "bg-gray-500",
    description: "You're feeling balanced and calm.",
  },
]

type EmotionContextType = {
  currentEmotion: string | null
  emotionHistory: Array<{ emotion: string; timestamp: Date }>
  detectEmotion: () => Promise<void>
  isDetecting: boolean
  setIsDetecting: (isDetecting: boolean) => void
  hasWebcamPermission: boolean | null
  requestWebcamPermission: () => Promise<boolean>
  webcamErrorType: string | null
  confidenceScores: Record<string, number>
  setCurrentEmotionWithConfidence: (emotion: string, confidences: Record<string, number>) => Promise<void>
  saveMoodFromEmotion: (emotion: string) => Promise<void>
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined)

export function useEmotion() {
  const context = useContext(EmotionContext)
  if (context === undefined) {
    throw new Error("useEmotion must be used within an EmotionProvider")
  }
  return context
}

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [emotionHistory, setEmotionHistory] = useState<Array<{ emotion: string; timestamp: Date }>>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [hasWebcamPermission, setHasWebcamPermission] = useState<boolean | null>(null)
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({})
  const { toast } = useToast()

  // Add a new state variable for the specific error type
  const [webcamErrorType, setWebcamErrorType] = useState<string | null>(null)

  // Check webcam permission on mount and load last emotion
  useEffect(() => {
    checkWebcamPermission()

    // Load emotion history from localStorage
    const savedHistory = localStorage.getItem("emotionHistory")
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory)
        // Convert string timestamps back to Date objects
        const formattedHistory = parsedHistory.map((item: any) => ({
          emotion: item.emotion,
          timestamp: new Date(item.timestamp),
        }))
        setEmotionHistory(formattedHistory)
      } catch (error) {
        console.error("Error parsing emotion history:", error)
      }
    }

    // Load last detected emotion from localStorage
    const lastEmotion = localStorage.getItem("tunimind-last-emotion")
    if (lastEmotion) {
      setCurrentEmotion(lastEmotion)
    }

    // Setup event listener for save mood modal
    window.addEventListener("showSaveMoodModal", handleSaveMoodModalEvent as EventListener)

    return () => {
      window.removeEventListener("showSaveMoodModal", handleSaveMoodModalEvent as EventListener)
    }
  }, [])

  // Handle save mood modal event
  const handleSaveMoodModalEvent = (event: CustomEvent) => {
    const { emotion, confidences } = event.detail

    // Show confirmation toast
    toast({
      title: `${emotions.find((e) => e.id === emotion)?.label || "Emotion"} Detected`,
      description: (
        <div className="flex flex-col gap-2">
          <p>Would you like to save this to your mood tracker?</p>
          <div className="flex gap-2 justify-end">
            <button
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
              onClick={() => saveMoodFromEmotion(emotion)}
            >
              Save
            </button>
            <button
              className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm"
              onClick={() => {
                // Instead of trying to dismiss the toast directly,
                // we don't need to do anything as the toast will auto-dismiss
                // when the button is clicked
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ),
      duration: 10000,
    })
  }

  // Save emotion history to localStorage when it changes
  useEffect(() => {
    if (emotionHistory.length > 0) {
      localStorage.setItem("emotionHistory", JSON.stringify(emotionHistory))
    }
  }, [emotionHistory])

  // Update the checkWebcamPermission function to better handle device not found errors
  const checkWebcamPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setHasWebcamPermission(true)
      return true
    } catch (error: any) {
      console.error("Webcam permission error:", error.name || error.message || error)

      // Set more specific error state based on the error type
      if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
        setWebcamErrorType("device_not_found")
      } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setWebcamErrorType("permission_denied")
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setWebcamErrorType("device_in_use")
      } else {
        setWebcamErrorType("generic_error")
      }

      setHasWebcamPermission(false)
      return false
    }
  }

  // Update the requestWebcamPermission function to provide more specific error messages
  const requestWebcamPermission = async () => {
    const result = await checkWebcamPermission()
    if (!result) {
      let errorMessage = "Please allow camera access to use emotion detection features."

      if (webcamErrorType === "device_not_found") {
        errorMessage = "No webcam detected. Please connect a webcam or try using a different device."
      } else if (webcamErrorType === "device_in_use") {
        errorMessage =
          "Your webcam is currently being used by another application. Please close other applications using your camera."
      }

      toast({
        title: "Camera Access Required",
        description: errorMessage,
        variant: "destructive",
      })
    }
    return result
  }

  const detectEmotionInternal = async () => {
    if (isDetecting) return

    setIsDetecting(true)

    try {
      // Check if we have webcam permission
      if (hasWebcamPermission === null) {
        const hasPermission = await checkWebcamPermission()
        if (!hasPermission) {
          setIsDetecting(false)
          return
        }
      } else if (hasWebcamPermission === false) {
        setIsDetecting(false)
        return
      }

      // In a real implementation, we would:
      // 1. Access the webcam
      // 2. Capture a frame
      // 3. Use TensorFlow.js or a similar library to detect the emotion
      // 4. Update the state with the detected emotion

      // For now, we'll simulate the detection with a random emotion
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)].id

      // Generate random confidence scores
      const confidences: Record<string, number> = {}
      emotions.forEach((emotion) => {
        // Base confidence is low
        let confidence = Math.random() * 0.2

        // Selected emotion gets higher confidence
        if (emotion.id === randomEmotion) {
          confidence = 0.7 + Math.random() * 0.3 // Between 0.7 and 1.0
        }

        confidences[emotion.id] = Number.parseFloat(confidence.toFixed(2))
      })

      // Normalize confidences to sum to 1
      const confidenceSum = Object.values(confidences).reduce((sum, val) => sum + val, 0)
      Object.keys(confidences).forEach((key) => {
        confidences[key] = Number.parseFloat((confidences[key] / confidenceSum).toFixed(2))
      })

      setConfidenceScores(confidences)
      setCurrentEmotion(randomEmotion)

      // Save last detected emotion to localStorage
      localStorage.setItem("tunimind-last-emotion", randomEmotion)

      // Add to history
      setEmotionHistory((prev) => {
        // Limit history to last 50 entries
        const newHistory = [{ emotion: randomEmotion, timestamp: new Date() }, ...prev]
        if (newHistory.length > 50) {
          return newHistory.slice(0, 50)
        }
        return newHistory
      })
    } catch (error) {
      console.error("Error detecting emotion:", error)
      toast({
        title: "Emotion Detection Failed",
        description: "There was an error detecting your emotion.",
        variant: "destructive",
      })
    } finally {
      setIsDetecting(false)
    }
  }

  const detectEmotion = async () => {
    await detectEmotionInternal()
  }

  // New function to set emotion with confidence scores
  const setCurrentEmotionWithConfidence = async (emotion: string, confidences: Record<string, number>) => {
    try {
      // Update the current emotion
      setCurrentEmotion(emotion)
      setConfidenceScores(confidences)

      // Save to localStorage for persistence
      localStorage.setItem("tunimind-last-emotion", emotion)

      // Add to history
      setEmotionHistory((prev) => {
        // Limit history to last 50 entries
        const newHistory = [{ emotion, timestamp: new Date() }, ...prev]
        if (newHistory.length > 50) {
          return newHistory.slice(0, 50)
        }
        return newHistory
      })

      // Animate the emoji change
      const emojiElement = document.querySelector("[data-emotion-emoji]")
      if (emojiElement) {
        emojiElement.classList.add("scale-150")
        setTimeout(() => {
          emojiElement.classList.remove("scale-150")
        }, 300)
      }
    } catch (error) {
      console.error("Error setting emotion with confidence:", error)
    }
  }

  // Function to save mood from detected emotion
  const saveMoodFromEmotion = async (emotion: string) => {
    try {
      // Import the saveMood function dynamically to avoid circular dependencies
      const { saveMood } = await import("@/lib/data-service")

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

      const mood = emotionToMoodMap[emotion] || "neutral"

      // Calculate intensity based on confidence
      const intensity = Math.round(5 + (confidenceScores[emotion] || 0.5) * 5)

      // Get current date
      const today = new Date()
      const dateStr = today.toISOString().split("T")[0]

      // Save to mood tracker
      await saveMood({
        date: dateStr,
        mood: mood,
        intensity: intensity,
        note: `Automatically detected from facial expression (${emotions.find((e) => e.id === emotion)?.label || emotion})`,
        activities: [],
      })

      toast({
        title: "Mood Saved",
        description: `Your detected ${emotions.find((e) => e.id === emotion)?.label || emotion} mood has been saved to your tracker.`,
      })
    } catch (error) {
      console.error("Error saving mood from emotion:", error)
      toast({
        title: "Error Saving Mood",
        description: "There was a problem saving your mood.",
        variant: "destructive",
      })
    }
  }

  // Add webcamErrorType to the context value
  const value = {
    currentEmotion,
    emotionHistory,
    detectEmotion,
    isDetecting,
    setIsDetecting,
    hasWebcamPermission,
    requestWebcamPermission,
    webcamErrorType,
    confidenceScores,
    setCurrentEmotionWithConfidence,
    saveMoodFromEmotion,
  }

  return <EmotionContext.Provider value={value}>{children}</EmotionContext.Provider>
}
