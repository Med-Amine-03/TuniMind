"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { FcGoogle } from "react-icons/fc"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  onSuccess?: () => void
  onSignUpClick?: () => void
}

export function LoginForm({ onSuccess, onSignUpClick }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await signIn(email, password)
      if (success) {
        if (onSuccess) onSuccess()
        // Redirect to dashboard after successful login
        router.push("/dashboard")
      } else {
        toast({
          title: "Account not found",
          description: "No account exists with these credentials. Please sign up first.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // Redirect to dashboard after successful login
      router.push("/dashboard")
    } catch (error) {
      // Error is already handled in the auth context
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button variant="link" className="px-0 text-xs" size="sm">
              Forgot password?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
        <FcGoogle className="mr-2 h-4 w-4" />
        Google
      </Button>

      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Button variant="link" className="p-0" onClick={onSignUpClick}>
          Sign up
        </Button>
      </div>
    </div>
  )
}
