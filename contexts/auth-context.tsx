"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/supabase"

type User = {
  id: string
  email: string
  password?: string // Added for account validation
  user_metadata?: {
    name?: string
  }
}

type Session = {
  user: User
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, name?: string, profileImage?: string | null) => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: { name?: string; bio?: string; profile_image_url?: string | null }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default profile image for the special user
const SPECIAL_USER_IMAGE =
"../../ena.jpg"
// Helper function to get registered users
const getRegisteredUsers = (): User[] => {
  try {
    const usersStr = localStorage.getItem("registeredUsers")
    if (!usersStr) return []
    return JSON.parse(usersStr)
  } catch (error) {
    console.error("Error getting registered users:", error)
    return []
  }
}

// Helper function to save registered users
const saveRegisteredUser = (user: User) => {
  try {
    const users = getRegisteredUsers()
    users.push(user)
    localStorage.setItem("registeredUsers", JSON.stringify(users))
  } catch (error) {
    console.error("Error saving registered user:", error)
  }
}

// Helper function to find a user by email
const findUserByEmail = (email: string): User | undefined => {
  const users = getRegisteredUsers()
  return users.find((user) => user.email === email)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize registered users if not exists
    if (!localStorage.getItem("registeredUsers")) {
      // Add the special user to registered users
      const specialUser: User = {
        id: "special_user_123",
        email: "amineothmani56@gmail.com",
        password: "123456",
        user_metadata: { name: "Amine Othmani", specialAccess: true },
      }
      localStorage.setItem("registeredUsers", JSON.stringify([specialUser]))

      // Create special user profile with default image
      const specialProfile: Profile = {
        id: specialUser.id,
        email: specialUser.email,
        name: "Amine Othmani",
        bio: "Mental health enthusiast and app tester",
        profile_image_url: SPECIAL_USER_IMAGE,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      localStorage.setItem(`profile_${specialUser.id}`, JSON.stringify(specialProfile))
    }

    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        setSession({ user: parsedUser })

        // Get profile from localStorage
        const storedProfile = localStorage.getItem("profile")
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile))
        } else {
          // Create default profile
          const defaultProfile: Profile = {
            id: parsedUser.id,
            email: parsedUser.email,
            name: parsedUser.user_metadata?.name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setProfile(defaultProfile)
          localStorage.setItem("profile", JSON.stringify(defaultProfile))
        }
      } catch (error) {
        console.error("Error parsing stored user:", error)
      }
    }

    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, name?: string, profileImage?: string | null) => {
    try {
      // Check if user already exists
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        toast({
          title: "Account already exists",
          description: "An account with this email already exists. Please log in instead.",
          variant: "destructive",
        })
        throw new Error("Account already exists")
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email,
        password, // Store password for validation
        user_metadata: { name },
      }

      // Register the user
      saveRegisteredUser(newUser)

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(newUser))
      localStorage.setItem("userId", newUser.id)
      localStorage.setItem("specialAccess", "false") // Regular user by default

      // Create profile
      const newProfile: Profile = {
        id: newUser.id,
        email: newUser.email,
        name: name || null,
        bio: null,
        profile_image_url: profileImage || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Store profile in localStorage
      localStorage.setItem("profile", JSON.stringify(newProfile))
      localStorage.setItem(`profile_${newUser.id}`, JSON.stringify(newProfile))

      // Update state
      setUser(newUser)
      setSession({ user: newUser })
      setProfile(newProfile)

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      })
      throw error
    }
  }

  // Update the signIn method to check for existing users
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Check for the special user
      if (email === "amineothmani56@gmail.com" && password === "123456") {
        // Special user with access to sample data
        const specialUser: User = {
          id: "special_user_123",
          email: "amineothmani56@gmail.com",
          user_metadata: { name: "Amine Othmani", specialAccess: true },
        }

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(specialUser))
        localStorage.setItem("userId", specialUser.id)
        localStorage.setItem("specialAccess", "true") // Set special access flag

        // Get or create special user profile
        let specialProfile: Profile
        const storedSpecialProfile = localStorage.getItem(`profile_${specialUser.id}`)

        if (storedSpecialProfile) {
          specialProfile = JSON.parse(storedSpecialProfile)
        } else {
          // Create profile with default image
          specialProfile = {
            id: specialUser.id,
            email: specialUser.email,
            name: "Amine Othmani",
            bio: "Mental health enthusiast and app tester",
            profile_image_url: SPECIAL_USER_IMAGE,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          // Store profile in localStorage
          localStorage.setItem(`profile_${specialUser.id}`, JSON.stringify(specialProfile))
        }

        // Store current profile
        localStorage.setItem("profile", JSON.stringify(specialProfile))

        // Update state
        setUser(specialUser)
        setSession({ user: specialUser })
        setProfile(specialProfile)

        toast({
          title: "Logged in successfully",
          description: "Welcome back, Amine!",
        })
        return true
      }

      // For all other users, ensure specialAccess is false
      localStorage.setItem("specialAccess", "false")

      // Check if user exists
      const existingUser = findUserByEmail(email)
      if (!existingUser || existingUser.password !== password) {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please check your credentials or sign up.",
          variant: "destructive",
        })
        return false
      }

      // User exists and password matches
      const loginUser = { ...existingUser }
      delete loginUser.password // Remove password before storing

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(loginUser))
      localStorage.setItem("userId", loginUser.id)
      localStorage.setItem("specialAccess", "false")

      // Get or create profile
      let userProfile: Profile
      const storedProfile = localStorage.getItem(`profile_${loginUser.id}`)

      if (storedProfile) {
        userProfile = JSON.parse(storedProfile)
      } else {
        // Create profile
        userProfile = {
          id: loginUser.id,
          email: loginUser.email,
          name: loginUser.user_metadata?.name || null,
          bio: null,
          profile_image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        // Store profile in localStorage
        localStorage.setItem(`profile_${loginUser.id}`, JSON.stringify(userProfile))
      }

      localStorage.setItem("profile", JSON.stringify(userProfile))

      // Update state
      setUser(loginUser)
      setSession({ user: loginUser })
      setProfile(userProfile)

      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      })
      return true
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      })
      return false
    }
  }

  const signInWithGoogle = async () => {
    try {
      // In a real app, you would redirect to Google OAuth
      // For now, we'll simulate a successful login with a random user
      const email = `google_user_${Date.now()}@example.com`
      const name = "Google User"

      // Check if this Google user already exists
      const existingUser = findUserByEmail(email)

      let googleUser: User

      if (existingUser) {
        // Use existing user
        googleUser = existingUser
      } else {
        // Create new user
        googleUser = {
          id: `google_user_${Date.now()}`,
          email,
          user_metadata: { name },
        }

        // Register the user
        saveRegisteredUser(googleUser)
      }

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(googleUser))
      localStorage.setItem("userId", googleUser.id)
      localStorage.setItem("specialAccess", "false")

      // Get or create profile
      let userProfile: Profile
      const storedProfile = localStorage.getItem(`profile_${googleUser.id}`)

      if (storedProfile) {
        userProfile = JSON.parse(storedProfile)
      } else {
        // Create profile
        userProfile = {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.user_metadata?.name || null,
          bio: null,
          profile_image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        // Store profile in localStorage
        localStorage.setItem(`profile_${googleUser.id}`, JSON.stringify(userProfile))
      }

      localStorage.setItem("profile", JSON.stringify(userProfile))

      // Update state
      setUser(googleUser)
      setSession({ user: googleUser })
      setProfile(userProfile)

      toast({
        title: "Logged in with Google",
        description: "You have been logged in successfully.",
      })
      return true
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = async () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem("user")
      localStorage.removeItem("profile")
      localStorage.removeItem("userId")
      localStorage.removeItem("specialAccess")

      // Clear state
      setUser(null)
      setSession(null)
      setProfile(null)

      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      })
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Check if user exists
      const existingUser = findUserByEmail(email)
      if (!existingUser) {
        toast({
          title: "Account not found",
          description: "No account exists with this email address.",
          variant: "destructive",
        })
        throw new Error("Account not found")
      }

      // In a real app, you would send a password reset email
      // For now, we'll just show a success message
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      })
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateProfile = async (data: { name?: string; bio?: string; profile_image_url?: string | null }) => {
    try {
      if (!user) throw new Error("No user logged in")

      // Update user metadata
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name: data.name,
        },
      }

      // Update profile
      const updatedProfile = profile
        ? {
            ...profile,
            name: data.name !== undefined ? data.name : profile.name,
            bio: data.bio !== undefined ? data.bio : profile.bio,
            profile_image_url:
              data.profile_image_url !== undefined ? data.profile_image_url : profile.profile_image_url,
            updated_at: new Date().toISOString(),
          }
        : null

      // Store updated data in localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser))
      if (updatedProfile) {
        localStorage.setItem("profile", JSON.stringify(updatedProfile))
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile))
      }

      // Update state
      setUser(updatedUser)
      setSession({ user: updatedUser })
      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
      throw error
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
