"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { FcGoogle } from "react-icons/fc"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

interface SignupFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function SignupForm({ onSuccess, onLoginClick }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { signUp, signInWithGoogle } = useAuth()

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfileImage(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Make sure to set specialAccess to false for new users
      localStorage.setItem("specialAccess", "false")

      await signUp(email, password, name, profileImage)
      if (onSuccess) onSuccess()
    } catch (error) {
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // No need to call onSuccess here as the redirect will happen
    } catch (error) {
      // Error is already handled in the auth context
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Enter your information to create an account</p>
      </div>

      <div className="flex justify-center">
        <div className="relative cursor-pointer group" onClick={handleImageClick}>
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            {profileImage ? (
              <AvatarImage src={profileImage || "/placeholder.svg"} alt="Profile" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
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
        Already have an account?{" "}
        <Button variant="link" className="p-0" onClick={onLoginClick}>
          Sign in
        </Button>
      </div>
    </div>
  )
}
