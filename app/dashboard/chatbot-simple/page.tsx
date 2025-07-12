"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Mic, User, Bot, MicOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  isThinking?: boolean
}

// Declare SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function ChatbotSimplePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your mental health assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { user, profile, session, loading } = useAuth()
  // Client-side auth redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loading && !user) {
      window.location.href = "/auth";
    }
  }, [user, loading]);

  if (loading || (typeof window !== "undefined" && !user)) {
    return null; // or a loading spinner
  }

  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("chatMessages")
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error)
    }
  }, [])

  // Save messages to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("chatMessages", JSON.stringify(messages))
    } catch (error) {
      console.error("Error saving messages to localStorage:", error)
    }
  }, [messages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Store user info in localStorage for persistence
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem("userEmail", user.email)
    }
    if (user?.id) {
      localStorage.setItem("userId", user.id)
    }
    if (profile?.name) {
      localStorage.setItem("userName", profile.name)
    }
  }, [user, profile])

  // Clear chat history when user logs out
  useEffect(() => {
    const handleStorageChange = () => {
      // Check if user is logged out
      const storedUser = localStorage.getItem("user")
      if (!storedUser) {
        // Clear chat messages
        setMessages([
          {
            id: "1",
            content: "Hello! I'm your mental health assistant. How can I help you today?",
            sender: "bot",
            timestamp: new Date(),
          },
        ])
        localStorage.removeItem("chatMessages")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check session directly
    if (!session) {
      localStorage.removeItem("chatMessages")
      setMessages([
        {
          id: "1",
          content: "Hello! I'm your mental health assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [session])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("")

        setInput(transcript)
      }

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsRecording(false)
        toast({
          title: "Voice Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        })
      }

      setRecognition(recognitionInstance)
    }
  }, [toast])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Create a thinking message
      const thinkingMessage: Message = {
        id: "thinking-" + Date.now().toString(),
        content: "Thinking...",
        sender: "bot",
        timestamp: new Date(),
        isThinking: true,
      }

      setMessages((prev) => [...prev, thinkingMessage])

      // Get user info from localStorage or auth context
      const userEmail = user?.email || localStorage.getItem("userEmail") || "anonymous"
      const userId = user?.id || localStorage.getItem("userId") || "anonymous"
      const storedUserName = profile?.name || localStorage.getItem("userName") || "Anonymous User"

      // Get additional profile information
      const userBio = profile?.bio || "No bio available"
      const userProfileImage = profile?.profile_image_url || null

      // Call the API with the user's message and profile info
      const response = await fetch("/api/chat-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: userId,
          userName: storedUserName,
          userEmail: userEmail,
          userProfile: {
            bio: userBio,
            profileImage: userProfileImage ? "Has profile image" : "No profile image",
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error(`API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`API responded with status: ${response.status}`)
      }

      // Process the non-streaming response
      const data = await response.json()

      // Remove the thinking message
      setMessages((prev) => prev.filter((msg) => !msg.isThinking))

      // Add the bot response
      const botMessage: Message = {
        id: "bot-" + Date.now().toString(),
        content: data.message,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error getting response:", error)
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      })

      // Remove thinking message and add error message
      setMessages((prev) => {
        const filteredMessages = prev.filter((msg) => !msg.isThinking)
        return [
          ...filteredMessages,
          {
            id: "error-" + Date.now().toString(),
            content: "I'm sorry, I couldn't process your request. Please try again later.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleRecording = () => {
    if (!recognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      setInput("")
      recognition.start()
      setIsRecording(true)
      toast({
        title: "Voice Recording Started",
        description: "Speak clearly into your microphone.",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Mental Health Assistant (Simple Mode)</h1>
      </div>

      <Card className="border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-soft">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start gap-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.isThinking ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-card">
          <div className="flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              disabled={isLoading}
              className="transition-all duration-200"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              placeholder={isRecording ? "Listening..." : "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              This chatbot is designed to provide support, not medical advice. If you're in crisis, please contact
              emergency services.
            </p>
            {isRecording && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-muted-foreground">Recording...</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
