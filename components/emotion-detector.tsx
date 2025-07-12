"use client"

import { useEffect, useState, useRef } from "react"
import { useEmotion, emotions } from "@/contexts/emotion-context"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export function EmotionDetector({ showLabel = false }: { showLabel?: boolean }) {
  const {
    currentEmotion,
    detectEmotion,
    isDetecting,
    hasWebcamPermission,
    requestWebcamPermission,
    setCurrentEmotionWithConfidence,
    setIsDetecting,
  } = useEmotion()
  const [showPermissionButton, setShowPermissionButton] = useState(false)
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false)
  const [areModelsLoaded, setAreModelsLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  // Load face-api.js library and models
  useEffect(() => {
    // Check if already loaded
    if (window.faceapi && areModelsLoaded) {
      setIsLibraryLoaded(true)
      return
    }

    const loadLibrary = async () => {
      try {
        setIsLibraryLoading(true)

        // Create script element if face-api is not loaded yet
        if (!window.faceapi) {
          // Create script element
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"
          script.async = true
          script.crossOrigin = "anonymous"

          // Create a promise that resolves when the script loads
          const scriptLoaded = new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Failed to load face-api.js"))
          })

          // Add script to document
          document.head.appendChild(script)

          // Wait for script to load
          await scriptLoaded

          // Wait a bit to ensure library is initialized
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (!window.faceapi) {
          throw new Error("Face API not available after loading")
        }

        console.log("Face API library loaded successfully, loading models...")

        // Load models
        try {
          // Set model paths - using CDN for reliability
          const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models"

          // Load all required models in parallel
          await Promise.all([
            window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ])

          console.log("All models loaded successfully")
          setAreModelsLoaded(true)
        } catch (modelError) {
          console.error("Error loading face-api models:", modelError)
          toast({
            title: "Model Loading Error",
            description: "Failed to load facial recognition models. Please refresh the page.",
            variant: "destructive",
          })
          throw modelError
        }

        setIsLibraryLoaded(true)
      } catch (error) {
        console.error("Error loading face-api library:", error)
        toast({
          title: "Error",
          description: "Failed to load emotion detection library",
          variant: "destructive",
        })
      } finally {
        setIsLibraryLoading(false)
      }
    }

    loadLibrary()
  }, [toast])

  // Handle webcam permission
  useEffect(() => {
    if (hasWebcamPermission === false) {
      setShowPermissionButton(true)
    } else {
      setShowPermissionButton(false)
    }
  }, [hasWebcamPermission])

  // Cleanup function to properly release resources
  const cleanupResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null
      }

      if (videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current)
      }

      videoRef.current = null
    }
  }

  // Improved emotion detection using webcam
  const handleDetectEmotion = async () => {
    if (!isLibraryLoaded || !window.faceapi) {
      toast({
        title: "Not Ready",
        description: "Emotion detection library is still loading",
      })
      return
    }

    if (!areModelsLoaded) {
      toast({
        title: "Models Loading",
        description: "Facial recognition models are still loading. Please wait.",
      })
      return
    }

    // Set detecting state
    setIsDetecting(true)

    try {
      // Clean up any existing resources first
      cleanupResources()

      // Create new video element
      const video = document.createElement("video")
      video.style.display = "none"
      document.body.appendChild(video)
      videoRef.current = video

      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      streamRef.current = stream
      video.srcObject = stream

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      // Wait a moment for the camera to adjust
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Use TinyFaceDetector for detection
      const faceDetectionOptions = new window.faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })

      // Detect face and expressions
      const result = await window.faceapi.detectSingleFace(video, faceDetectionOptions).withFaceExpressions()

      // Clean up resources
      cleanupResources()

      if (result && result.expressions) {
        console.log("Detected expressions:", result.expressions)

        // Map expressions to our emotion types
        const expressionMap: Record<string, string> = {
          happy: "happy",
          sad: "sad",
          angry: "angry",
          fearful: "fearful",
          disgusted: "disgusted",
          surprised: "surprised",
          neutral: "neutral",
        }

        // Find highest confidence expression
        let highestExpression = "neutral"
        let highestConfidence = 0

        Object.entries(result.expressions).forEach(([expression, confidence]) => {
          const lowerExpression = expression.toLowerCase()
          if (confidence > highestConfidence) {
            highestConfidence = confidence
            highestExpression = expressionMap[lowerExpression] || "neutral"
          }
        })

        // Create confidence scores
        const confidenceScores: Record<string, number> = {}
        emotions.forEach((emotion) => {
          const matchingExpression = Object.keys(expressionMap).find((exp) => expressionMap[exp] === emotion.id)
          confidenceScores[emotion.id] = matchingExpression ? result.expressions[matchingExpression] || 0 : 0
        })

        // Update emotion
        await setCurrentEmotionWithConfidence(highestExpression, confidenceScores)

        // Show confirmation modal
        showSaveMoodConfirmation(highestExpression, confidenceScores)

        return highestExpression
      } else {
        console.log("No face detected")
        toast({
          title: "No Face Detected",
          description: "Please make sure your face is visible to the camera",
        })
        return null
      }
    } catch (error) {
      console.error("Error detecting emotion:", error)
      toast({
        title: "Detection Error",
        description: "There was a problem detecting your emotion",
        variant: "destructive",
      })
      return null
    } finally {
      // Ensure we're no longer in detecting state
      setIsDetecting(false)
    }
  }

  // Function to show confirmation modal
  const showSaveMoodConfirmation = (emotion: string, confidences: Record<string, number>) => {
    const event = new CustomEvent("showSaveMoodModal", {
      detail: { emotion, confidences },
    })
    window.dispatchEvent(event)
  }

  const emotion = emotions.find((e) => e.id === currentEmotion)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {showPermissionButton ? (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => requestWebcamPermission()}
              >
                <Camera className="h-4 w-4" />
                {showLabel && <span>Enable Emotion Detection</span>}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${isDetecting ? "animate-pulse" : ""}`}
                onClick={() => {
                  handleDetectEmotion()
                }}
                disabled={isDetecting || isLibraryLoading || !isLibraryLoaded || !areModelsLoaded}
              >
                <span className="text-xl transition-transform duration-300 hover:scale-110" data-emotion-emoji>
                  {emotion?.emoji || "😶"}
                </span>
              </Button>
            )}
            {showLabel && emotion && <span className="text-sm">{emotion.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {emotion ? (
            <div className="text-center">
              <p className="font-medium">{emotion.label}</p>
              <p className="text-xs">{emotion.description}</p>
              <p className="text-xs mt-1">Click to refresh</p>
            </div>
          ) : showPermissionButton ? (
            <p>Enable camera access for emotion detection</p>
          ) : isLibraryLoading ? (
            <p>Loading emotion detection...</p>
          ) : !isLibraryLoaded ? (
            <p>Preparing emotion detection...</p>
          ) : !areModelsLoaded ? (
            <p>Loading facial recognition models...</p>
          ) : (
            <p>Click to detect your emotion</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
