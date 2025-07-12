// This file contains types for the Supabase integration
// We're keeping it for type definitions even though we're using localStorage instead of Supabase

export interface Profile {
  id: string
  email: string
  name: string | null
  bio?: string | null
  profile_image_url?: string | null
  created_at: string
  updated_at: string
}

// This is a placeholder for Supabase types
// In a real app with Supabase, this file would contain actual Supabase client setup
// For now, we're just using it for type definitions

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at" | "updated_at">
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
      }
      moods: {
        Row: {
          id: string
          user_id: string
          date: string
          mood: string
          intensity: number
          note?: string | null
          activities?: string[] | null
          created_at: string
        }
      }
      emotions: {
        Row: {
          id: string
          user_id: string
          date: string
          emotion: string
          confidence: number
          image_url?: string | null
          created_at: string
        }
      }
    }
  }
}

// Remove Supabase client and replace with localStorage functions
import type { User } from "@supabase/supabase-js"

// Export types
// export type Profile = {
//   id: string
//   email: string
//   name: string | null
//   created_at: string
//   updated_at: string
//   profile_image_url?: string | null
//   bio?: string | null
// }

// Mock functions for localStorage-based auth
export const getLocalUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error("Error getting local user:", error)
    return null
  }
}

export const getLocalProfile = (): Profile | null => {
  try {
    const profileStr = localStorage.getItem("profile")
    if (!profileStr) return null
    return JSON.parse(profileStr)
  } catch (error) {
    console.error("Error getting local profile:", error)
    return null
  }
}

export const hasSpecialAccess = (): boolean => {
  return localStorage.getItem("specialAccess") === "true"
}

export const supabaseClient = {
  auth: {
    getSession: async () => {
      return { data: { session: null }, error: null }
    },
  },
  from: (table: string) => ({
    select: () => ({
      limit: () => ({
        catch: () => ({ data: null, error: null }),
      }),
    }),
  }),
  rpc: (fn: string, args: any) => ({
    catch: () => ({ data: null }),
  }),
}
