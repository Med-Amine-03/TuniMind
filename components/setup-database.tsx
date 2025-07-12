"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Database } from "lucide-react"

interface SetupDatabaseProps {
  onComplete?: () => void
}

export function SetupDatabase({ onComplete }: SetupDatabaseProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSetupDatabase = async () => {
    setIsLoading(true)
    try {
      // Since we're using localStorage instead of a real database,
      // we'll just simulate the setup process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Initialize empty collections in localStorage if they don't exist
      if (!localStorage.getItem("moods")) {
        localStorage.setItem("moods", JSON.stringify([]))
      }

      if (!localStorage.getItem("emotions")) {
        localStorage.setItem("emotions", JSON.stringify([]))
      }

      if (!localStorage.getItem("preferences")) {
        localStorage.setItem("preferences", JSON.stringify({}))
      }

      toast({
        title: "Setup Complete",
        description: "Local storage has been initialized successfully.",
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("Error setting up local storage:", error)
      toast({
        title: "Setup Failed",
        description: "There was a problem initializing local storage.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSetupDatabase} disabled={isLoading} className="flex items-center gap-2">
      <Database className="h-4 w-4" />
      {isLoading ? "Setting up..." : "Setup Storage"}
    </Button>
  )
}
