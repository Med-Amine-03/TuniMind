"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useEmotion } from "@/contexts/emotion-context"
import { AlertCircle, Camera, Save } from "lucide-react"
import { saveEmotion, uploadEmotionImage } from "@/lib/data-service"
import { useAuth } from "@/contexts/auth-context"

// Demo mode data
const demoEmotions = [
  { emotion: "happy", probability: 0.85 },
  { emotion: "neutral", probability: 0.1 },
  { emotion: "surprise", probability: 0.03 },
  { emotion: "sad", probability: 0.01 },
  { emotion: "angry", probability: 0.005 },
  { emotion: "fear", probability: 0.003 },
  { emotion: "disgust", probability: 0.002 },
]

export default function EmotionDetectionPage() {
  const [activeTab, setActiveTab] = useState("live")
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [detectionResults, setDetectionResults] = useState<Array<{ emotion: string; probability: number }>>([])
  const [webcamActive, setWebcamActive] = useState(false)
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [webcamErrorType, setWebcamErrorType] = useState<"permission" | "notFound" | "notReadable" | "other" | null>(
    null,
  )
  const [demoMode, setDemoMode] = useState(false)
  const [areModelsLoaded, setAreModelsLoaded] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const { setCurrentEmotionWithConfidence } = useEmotion()
  const { user } = useAuth()

  // Load face-api.js library and models
  useEffect(() => {
    const loadFaceApiModels = async () => {
      setIsModelLoading(true)
      setLoadingProgress(0)

      try {
        // Simulate loading progress
        const interval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev >= 95) {
              clearInterval(interval)
              return prev
            }
            return prev + Math.floor(Math.random() * 5) + 1
          })
        }, 200)

        // Check if face-api is already loaded
        if (!window.faceapi) {
          // Load face-api.js script
          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"
          script.async = true
          script.crossOrigin = "anonymous"

          // Wait for script to load
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve()
            script.onerror = () => reject(new Error("Failed to load face-api.js"))
            document.head.appendChild(script)
          })

          // Wait for library to initialize
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        if (!window.faceapi) {
          throw new Error("Face API not available after loading")
        }

        // Load models from CDN for reliability
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models"

        // Load all required models in parallel
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])

        console.log("All face-api models loaded successfully")
        setAreModelsLoaded(true)

        clearInterval(interval)
        setLoadingProgress(100)
        setIsModelLoaded(true)

        toast({
          title: "Model Loaded",
          description: "Emotion detection model has been loaded successfully.",
        })
      } catch (error) {
        console.error("Error loading face-api models:", error)
        toast({
          title: "Model Loading Error",
          description: "Failed to load emotion detection models. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsModelLoading(false)
      }
    }

    loadFaceApiModels()

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [toast])

  // Check webcam permission
  const checkWebcamPermission = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      if (videoDevices.length === 0) {
        setWebcamErrorType("notFound")
        setWebcamError("No webcam found. Please connect a webcam to use this feature.")
        return false
      }

      return true
    } catch (error) {
      console.error("Error checking webcam:", error)
      setWebcamErrorType("other")
      setWebcamError("Could not access webcam information. Please check your browser settings.")
      return false
    }
  }

  // Request webcam permission
  const requestWebcamPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      return true
    } catch (error) {
      console.error("Webcam permission error:", error)

      if (error instanceof DOMException) {
        if (error.name === "NotFoundError") {
          setWebcamErrorType("notFound")
          setWebcamError("No webcam found. Please connect a webcam to use this feature.")
        } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setWebcamErrorType("permission")
          setWebcamError("Webcam access denied. Please allow camera access in your browser settings.")
        } else if (error.name === "NotReadableError") {
          setWebcamErrorType("notReadable")
          setWebcamError("Could not access your webcam. It may be in use by another application.")
        } else {
          setWebcamErrorType("other")
          setWebcamError(`Webcam error: ${error.message}`)
        }
      } else {
        setWebcamErrorType("other")
        setWebcamError("An unknown error occurred while accessing the webcam.")
      }

      return false
    }
  }

  // Start webcam
  const startWebcam = async () => {
    setWebcamError(null)
    setWebcamErrorType(null)
    setDemoMode(false)

    const hasWebcam = await checkWebcamPermission()
    if (!hasWebcam) {
      return
    }

    const hasPermission = await requestWebcamPermission()
    if (!hasPermission) {
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setWebcamActive(true)
        setWebcamError(null)
        setWebcamErrorType(null)
      }
    } catch (error) {
      console.error("Error starting webcam:", error)

      if (error instanceof DOMException) {
        if (error.name === "NotFoundError") {
          setWebcamErrorType("notFound")
          setWebcamError("No webcam found. Please connect a webcam to use this feature.")
        } else if (error.name === "NotAllowedError") {
          setWebcamErrorType("permission")
          setWebcamError("Webcam access denied. Please allow camera access in your browser settings.")
        } else if (error.name === "NotReadableError") {
          setWebcamErrorType("notReadable")
          setWebcamError("Could not access your webcam. It may be in use by another application.")
        } else {
          setWebcamErrorType("other")
          setWebcamError(`Webcam error: ${error.message}`)
        }
      } else {
        setWebcamErrorType("other")
        setWebcamError("An unknown error occurred while accessing the webcam.")
      }
    }
  }

  // Stop webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setWebcamActive(false)
    }
  }

  // Capture image from webcam
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data URL
    const imageDataURL = canvas.toDataURL("image/png")
    setCapturedImage(imageDataURL)

    // Switch to analysis tab
    setActiveTab("analysis")

    // Detect emotions in the captured image
    detectEmotions(canvas)
  }

  // Detect emotions in an image using face-api.js
  const detectEmotions = async (canvas: HTMLCanvasElement) => {
    if (isModelLoading) {
      toast({
        title: "Model Loading",
        description: "Emotion detection model is still loading. Please wait.",
        variant: "destructive",
      })
      return
    }

    if (!areModelsLoaded || !window.faceapi) {
      toast({
        title: "Models Not Ready",
        description: "Facial recognition models are not fully loaded. Please wait or refresh the page.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Use face-api.js to detect emotions
      const faceDetectionOptions = new window.faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5,
      })

      // Detect face and expressions
      const result = await window.faceapi.detectSingleFace(canvas, faceDetectionOptions).withFaceExpressions()

      if (result && result.expressions) {
        console.log("Detected expressions:", result.expressions)

        // Convert face-api.js results to our format
        const results = [
          { emotion: "happy", probability: result.expressions.happy || 0 },
          { emotion: "sad", probability: result.expressions.sad || 0 },
          { emotion: "angry", probability: result.expressions.angry || 0 },
          { emotion: "surprise", probability: result.expressions.surprised || 0 },
          { emotion: "fear", probability: result.expressions.fearful || 0 },
          { emotion: "disgust", probability: result.expressions.disgusted || 0 },
          { emotion: "neutral", probability: result.expressions.neutral || 0 },
        ]

        // Sort by probability (highest first)
        results.sort((a, b) => b.probability - a.probability)

        // Normalize probabilities to sum to 1
        const sum = results.reduce((acc, item) => acc + item.probability, 0)
        const normalizedResults = results.map((item) => ({
          emotion: item.emotion,
          probability: item.probability / sum,
        }))

        setDetectionResults(normalizedResults)

        // Update current emotion in context with confidence scores
        if (normalizedResults.length > 0) {
          const confidences = normalizedResults.reduce(
            (obj, item) => {
              obj[item.emotion] = item.probability
              return obj
            },
            {} as Record<string, number>,
          )
          setCurrentEmotionWithConfidence(normalizedResults[0].emotion, confidences)
        }
      } else {
        console.log("No face detected")
        toast({
          title: "No Face Detected",
          description: "No face was detected in the image. Please try again with a clearer image.",
        })

        // Use demo data as fallback
        setDemoMode(true)
        setDetectionResults(demoEmotions)
      }
    } catch (error) {
      console.error("Error detecting emotions:", error)
      toast({
        title: "Detection Error",
        description: "An error occurred while detecting emotions. Using demo data instead.",
      })

      // Use demo data as fallback
      setDemoMode(true)
      setDetectionResults(demoEmotions)
    } finally {
      setIsProcessing(false)
    }
  }

  // Start demo mode
  const startDemoMode = () => {
    setDemoMode(true)
    stopWebcam()
    setWebcamError(null)
    setWebcamErrorType(null)

    // Use a placeholder image for demo
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "/placeholder.svg?height=480&width=640"
    img.onload = () => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (!context) return

      // Set canvas dimensions
      canvas.width = 640
      canvas.height = 480

      // Draw image to canvas
      context.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Get image data URL
      const imageDataURL = canvas.toDataURL("image/png")
      setCapturedImage(imageDataURL)

      // Switch to analysis tab
      setActiveTab("analysis")

      // Use demo data
      setDetectionResults(demoEmotions)
    }
  }

  // Save emotion to local storage (fallback when not authenticated)
  const saveEmotionToLocalStorage = () => {
    if (!capturedImage || detectionResults.length === 0) return

    try {
      // Get existing data or initialize empty array
      const existingData = localStorage.getItem("emotionDetectionResults")
      const results = existingData ? JSON.parse(existingData) : []

      // Add new result
      results.push({
        id: Date.now().toString(),
        emotion: detectionResults[0].emotion,
        confidence_scores: detectionResults.reduce(
          (obj, item) => {
            obj[item.emotion] = item.probability
            return obj
          },
          {} as Record<string, number>,
        ),
        timestamp: new Date().toISOString(),
      })

      // Save back to local storage
      localStorage.setItem("emotionDetectionResults", JSON.stringify(results))

      toast({
        title: "Emotion Saved Locally",
        description: "Your emotion detection result has been saved to your browser. Log in to save to your account.",
      })
    } catch (error) {
      console.error("Error saving to local storage:", error)
      toast({
        title: "Error",
        description: "Failed to save your emotion detection result locally.",
        variant: "destructive",
      })
    }
  }

  // Save emotion detection result
  const saveEmotionResult = async () => {
    if (!capturedImage || detectionResults.length === 0) return

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your emotion detection results.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Generate a unique timestamp for this emotion detection
      const timestamp = Date.now().toString()

      // Get image data - we're using a placeholder now instead of actual storage
      const imageData = await uploadEmotionImage(new Blob(), timestamp)

      // Save the emotion data to Supabase - let Supabase generate the UUID
      await saveEmotion({
        emotion: detectionResults[0].emotion,
        confidence_scores: detectionResults.reduce(
          (obj, item) => {
            obj[item.emotion] = item.probability
            return obj
          },
          {} as Record<string, number>,
        ),
        image_url: imageData.url,
        image_path: imageData.path,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Emotion Saved",
        description: "Your emotion detection result has been saved.",
      })
    } catch (error) {
      console.error("Error saving emotion:", error)
      toast({
        title: "Error",
        description: "Failed to save your emotion detection result.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Save to mood tracker
  const saveToMoodTracker = async () => {
    if (detectionResults.length === 0) return

    try {
      // Import the saveMood function dynamically
      const { saveMood } = await import("@/lib/data-service")

      // Map emotion to mood
      const emotionToMoodMap: Record<string, string> = {
        happy: "happy",
        sad: "sad",
        angry: "angry",
        surprise: "excited",
        fear: "anxious",
        disgust: "tired",
        neutral: "neutral",
      }

      const detectedEmotion = detectionResults[0].emotion
      const mood = emotionToMoodMap[detectedEmotion] || "neutral"

      // Calculate intensity based on confidence (1-10 scale)
      const intensity = Math.round(5 + detectionResults[0].probability * 5)

      // Get current date
      const today = new Date()
      const dateStr = today.toISOString().split("T")[0]

      // Save to mood tracker
      await saveMood({
        date: dateStr,
        mood: mood,
        intensity: intensity,
        note: `Detected from facial expression (${detectedEmotion})`,
        activities: [],
      })

      toast({
        title: "Added to Mood Tracker",
        description: "Your detected emotion has been saved to your mood tracker.",
      })

      // Show success message
      setActiveTab("live")
      setCapturedImage(null)
      setDetectionResults([])
    } catch (error) {
      console.error("Error saving to mood tracker:", error)
      toast({
        title: "Error",
        description: "Failed to save your emotion to the mood tracker.",
        variant: "destructive",
      })
    }
  }

  // Get emotion color
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: "bg-green-500",
      sad: "bg-blue-500",
      angry: "bg-red-500",
      fear: "bg-purple-500",
      disgust: "bg-yellow-500",
      surprise: "bg-pink-500",
      neutral: "bg-gray-500",
    }

    return colors[emotion] || "bg-gray-500"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Emotion Detection</h1>
      <p className="text-muted-foreground mb-6">Detect and analyze your emotions in real-time using your webcam.</p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="live">Live Camera</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Live Camera Feed</CardTitle>
              <CardDescription>Use your webcam to capture your facial expression for emotion analysis.</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              {isModelLoading ? (
                <div className="w-full max-w-2xl mx-auto bg-black/10 rounded-lg p-8 flex flex-col items-center justify-center">
                  <h3 className="text-lg font-medium mb-4">Loading Emotion Detection Model</h3>
                  <Progress value={loadingProgress} className="w-full max-w-md mb-4" />
                  <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                </div>
              ) : (
                <div className="relative w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden">
                  {webcamError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 text-white z-10">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <h3 className="text-xl font-bold mb-2">Camera Error</h3>
                      <p className="text-center mb-4">{webcamError}</p>

                      {webcamErrorType === "permission" && (
                        <div className="text-center text-sm text-gray-300 mb-4">
                          <p>Please allow camera access in your browser settings:</p>
                          <ol className="list-decimal list-inside mt-2 text-left">
                            <li>Click the camera icon in your browser&apos;s address bar</li>
                            <li>Select &quot;Allow&quot; for camera access</li>
                            <li>Refresh this page</li>
                          </ol>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button onClick={startWebcam} variant="outline">
                          Try Again
                        </Button>
                        <Button onClick={startDemoMode} variant="default">
                          Use Demo Mode
                        </Button>
                      </div>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    onPlay={() => setWebcamActive(true)}
                  />

                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              <div className="flex gap-4 mt-6">
                {!isModelLoading && (
                  <>
                    {!webcamActive ? (
                      <Button onClick={startWebcam} className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={captureImage} className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Capture Image
                      </Button>
                    )}

                    {!demoMode && (
                      <Button onClick={startDemoMode} variant="outline">
                        Use Demo Mode
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {isModelLoaded ? (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Model loaded and ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    Loading emotion detection model...
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Emotion Analysis</CardTitle>
              <CardDescription>View the analysis of your captured facial expression.</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center">
              {capturedImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col items-center">
                    <div className="bg-black rounded-lg overflow-hidden mb-4">
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured facial expression"
                        className="w-full h-auto"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        setActiveTab("live")
                        setCapturedImage(null)
                        setDetectionResults([])
                      }}
                      variant="outline"
                    >
                      Take New Photo
                    </Button>
                  </div>

                  <div className="flex flex-col">
                    {isProcessing ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-center mb-4">Analyzing your emotion...</p>
                        <Progress value={45} className="w-full max-w-md" />
                      </div>
                    ) : detectionResults.length > 0 ? (
                      <>
                        <h3 className="text-xl font-bold mb-4">
                          Detected Emotion: <span className="capitalize">{detectionResults[0].emotion}</span>
                        </h3>

                        <div className="space-y-4">
                          {detectionResults.map((result) => (
                            <div key={result.emotion} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="capitalize">{result.emotion}</span>
                                <span>{Math.round(result.probability * 100)}%</span>
                              </div>
                              <Progress
                                value={result.probability * 100}
                                className={`h-2 ${getEmotionColor(result.emotion)}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 mt-6">
                          {!user ? (
                            <>
                              <Button
                                onClick={saveEmotionToLocalStorage}
                                className="flex items-center gap-2"
                                disabled={isProcessing}
                              >
                                <Save className="h-4 w-4" />
                                Save Locally
                              </Button>
                              <p className="text-xs text-muted-foreground text-center">
                                Log in to save results to your account
                              </p>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={saveEmotionResult}
                                className="flex items-center gap-2"
                                disabled={isProcessing}
                              >
                                <Save className="h-4 w-4" />
                                Save Result
                              </Button>
                              <Button
                                onClick={saveToMoodTracker}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={isProcessing}
                              >
                                Add to Mood Tracker
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-center">No emotion analysis available.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-center mb-4">No image captured yet.</p>
                  <Button onClick={() => setActiveTab("live")}>Capture an Image</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
