"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if signup parameter is present
    if (searchParams.get("signup") === "true") {
      setMode("signup")
    }
  }, [searchParams])

  const handleSuccess = () => {
    router.push("/dashboard")
  }

  const handleDevBypass = () => {
    // For development only - create a mock user and redirect
    if (process.env.NODE_ENV === "development") {
      const mockUser = {
        id: `dev_user_${Date.now()}`,
        email: "dev@example.com",
        user_metadata: { name: "Development User" },
      }

      localStorage.setItem("user", JSON.stringify(mockUser))

      // Create default profile
      const defaultProfile = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.user_metadata?.name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localStorage.setItem("profile", JSON.stringify(defaultProfile))

      // Redirect to dashboard
      router.push("/dashboard")
    }
  }

  return (
    <div className="container flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {mode === "login" ? (
            <LoginForm onSuccess={handleSuccess} onSignUpClick={() => setMode("signup")} />
          ) : (
            <SignupForm onSuccess={handleSuccess} onLoginClick={() => setMode("login")} />
          )}

          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="secondary" className="w-full" onClick={handleDevBypass}>
                Development Mode: Skip Authentication
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This option is only available in development mode
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
