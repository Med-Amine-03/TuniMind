// Types
export interface MoodEntry {
  id?: string
  user_id?: string
  date: string
  mood: string
  intensity: number
  note?: string
  activities?: string[]
  created_at?: string
}

export interface EmotionEntry {
  id?: string
  user_id?: string
  date: string
  emotion: string
  confidence: number
  image_url?: string
  created_at?: string
}

// Helper function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Update the getMoods function to ensure proper user data isolation
export async function getMoods(days = 30): Promise<MoodEntry[]> {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Check if the user has special access
    const hasSpecialAccess = localStorage.getItem("specialAccess") === "true"

    // Get real data from localStorage
    const localData = localStorage.getItem("moods")
    let allMoods: MoodEntry[] = []

    if (localData) {
      try {
        allMoods = JSON.parse(localData)
      } catch (e) {
        console.error("Error parsing mood data:", e)
        allMoods = []
      }
    }

    // Filter moods to only include the current user's data
    const userMoods = allMoods.filter((mood) => mood.user_id === userId)

    // If user has special access, combine real data with sample data
    if (hasSpecialAccess) {
      const sampleData = generateSampleMoodData()

      // Combine real and sample data
      const combinedData = [...userMoods, ...sampleData]

      // Sort by date (newest first)
      combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Remove duplicates (prefer real data over sample data)
      const uniqueDates = new Set<string>()
      const uniqueData = combinedData.filter((item) => {
        if (uniqueDates.has(item.date)) {
          return false
        }
        uniqueDates.add(item.date)
        return true
      })

      return uniqueData.slice(0, days)
    }

    // For regular users, return only their real data
    return userMoods.slice(0, days)
  } catch (error) {
    console.error("Error fetching moods:", error)
    return []
  }
}

// Update the getEmotions function similarly
export async function getEmotions(days = 30): Promise<EmotionEntry[]> {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Check if the user has special access
    const hasSpecialAccess = localStorage.getItem("specialAccess") === "true"

    // Get real data from localStorage
    const localData = localStorage.getItem("emotions")
    let allEmotions: EmotionEntry[] = []

    if (localData) {
      try {
        allEmotions = JSON.parse(localData)
      } catch (e) {
        console.error("Error parsing emotion data:", e)
        allEmotions = []
      }
    }

    // Filter emotions to only include the current user's data
    const userEmotions = allEmotions.filter((emotion) => emotion.user_id === userId)

    // If user has special access, combine real data with sample data
    if (hasSpecialAccess) {
      const sampleData = generateSampleEmotionData()

      // Combine real and sample data
      const combinedData = [...userEmotions, ...sampleData]

      // Sort by date (newest first)
      combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Remove duplicates (prefer real data over sample data)
      const uniqueDates = new Set<string>()
      const uniqueData = combinedData.filter((item) => {
        if (uniqueDates.has(item.date)) {
          return false
        }
        uniqueDates.add(item.date)
        return true
      })

      return uniqueData.slice(0, days)
    }

    // For regular users, return only their real data
    return userEmotions.slice(0, days)
  } catch (error) {
    console.error("Error fetching emotions:", error)
    return []
  }
}

// Save a mood entry to localStorage with proper user ID
export async function saveMood(mood: MoodEntry): Promise<void> {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing moods from localStorage
    const existingMoods = JSON.parse(localStorage.getItem("moods") || "[]")

    // Check if an entry for this date already exists for this user
    const existingIndex = existingMoods.findIndex((m: MoodEntry) => m.date === mood.date && m.user_id === userId)

    if (existingIndex >= 0) {
      // Update existing entry
      existingMoods[existingIndex] = {
        ...existingMoods[existingIndex],
        ...mood,
        user_id: userId, // Ensure user_id is set
        updated_at: new Date().toISOString(),
      }
    } else {
      // Add new entry with user_id
      existingMoods.push({
        ...mood,
        id: `local-${Date.now()}`,
        user_id: userId, // Set the user_id
        created_at: new Date().toISOString(),
      })
    }

    // Save back to localStorage
    localStorage.setItem("moods", JSON.stringify(existingMoods))
  } catch (error) {
    console.error("Error saving mood:", error)
    throw error
  }
}

// Function to export all user data
export async function exportData() {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"
    const hasSpecialAccess = localStorage.getItem("specialAccess") === "true"

    let moods = []
    let emotions = []

    // Try to get from local storage
    try {
      // Get all data
      const allMoods = JSON.parse(localStorage.getItem("moods") || "[]")
      const allEmotions = JSON.parse(localStorage.getItem("emotions") || "[]")

      // Filter to only include current user's data
      moods = allMoods.filter((mood) => mood.user_id === userId)
      emotions = allEmotions.filter((emotion) => emotion.user_id === userId)
    } catch (error) {
      console.error("Error reading from localStorage:", error)
    }

    // If no data in localStorage and user has special access, generate sample data
    if (moods.length === 0 && hasSpecialAccess) {
      moods = generateSampleMoodData()
    }

    if (emotions.length === 0 && hasSpecialAccess) {
      emotions = generateSampleEmotionData()
    }

    return {
      moods,
      emotions,
      exportDate: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return {
      moods: [],
      emotions: [],
      exportDate: new Date().toISOString(),
    }
  }
}

// Function to import user data
export async function importData(data: any) {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Validate data structure
    if (!data.moods || !Array.isArray(data.moods)) {
      throw new Error("Invalid data format: moods array is missing")
    }

    // Get existing data
    const existingMoods = JSON.parse(localStorage.getItem("moods") || "[]")

    // Remove any existing data for this user
    const otherUsersMoods = existingMoods.filter((mood) => mood.user_id !== userId)

    // Add user_id to imported moods
    const importedMoods = data.moods.map((mood) => ({
      ...mood,
      user_id: userId, // Ensure user_id is set to current user
    }))

    // Combine with other users' data
    const newMoods = [...otherUsersMoods, ...importedMoods]

    // Store in local storage
    localStorage.setItem("moods", JSON.stringify(newMoods))

    if (data.emotions && Array.isArray(data.emotions)) {
      // Get existing emotions
      const existingEmotions = JSON.parse(localStorage.getItem("emotions") || "[]")

      // Remove any existing emotions for this user
      const otherUsersEmotions = existingEmotions.filter((emotion) => emotion.user_id !== userId)

      // Add user_id to imported emotions
      const importedEmotions = data.emotions.map((emotion) => ({
        ...emotion,
        user_id: userId, // Ensure user_id is set to current user
      }))

      // Combine with other users' data
      const newEmotions = [...otherUsersEmotions, ...importedEmotions]

      localStorage.setItem("emotions", JSON.stringify(newEmotions))
    }

    return true
  } catch (error) {
    console.error("Error importing data:", error)
    throw error
  }
}

// Function to clear all user data
export async function clearAllData() {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing data
    const existingMoods = JSON.parse(localStorage.getItem("moods") || "[]")
    const existingEmotions = JSON.parse(localStorage.getItem("emotions") || "[]")

    // Filter out current user's data
    const otherUsersMoods = existingMoods.filter((mood) => mood.user_id !== userId)
    const otherUsersEmotions = existingEmotions.filter((emotion) => emotion.user_id !== userId)

    // Save back only other users' data
    localStorage.setItem("moods", JSON.stringify(otherUsersMoods))
    localStorage.setItem("emotions", JSON.stringify(otherUsersEmotions))

    return true
  } catch (error) {
    console.error("Error clearing all data:", error)
    throw error
  }
}

// Function to generate sample mood data - export this for the sample data button
export function generateSampleMoodData(): MoodEntry[] {
  const today = new Date()
  const result: MoodEntry[] = []
  // Get current user ID for sample data
  const userId = localStorage.getItem("userId") || "anonymous"

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    // Skip some days to make it look more realistic
    if (i % 4 === 0) continue

    // Create a wave pattern
    const phase = (i / 30) * Math.PI * 2
    const baseValue = 5 // Middle value
    const amplitude = 4 // How much it varies

    // Calculate a wave pattern value between 1-10
    const waveValue = baseValue + amplitude * Math.sin(phase)
    const intensity = Math.max(1, Math.min(10, Math.round(waveValue)))

    // Assign mood based on the value
    let mood: string
    if (intensity >= 8) {
      mood = "happy"
    } else if (intensity >= 6) {
      mood = "content"
    } else if (intensity >= 5) {
      mood = "neutral"
    } else if (intensity >= 3) {
      mood = "tired"
    } else {
      mood = "sad"
    }

    // Add some variety with other emotions occasionally
    if (i % 7 === 0) mood = "excited"
    if (i % 11 === 0) mood = "anxious"
    if (i % 13 === 0) mood = "angry"

    result.push({
      id: `sample-${i}`,
      user_id: userId, // Add user_id to sample data
      date: date.toISOString().split("T")[0],
      mood,
      intensity,
      activities: getRandomActivities(),
      note: `Generated sample data for ${date.toDateString()}`,
      created_at: new Date().toISOString(),
    })
  }

  return result
}

// Function to generate sample emotion data - export this for the sample data button
export function generateSampleEmotionData(): EmotionEntry[] {
  const today = new Date()
  const result: EmotionEntry[] = []
  const emotions = ["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"]
  // Get current user ID for sample data
  const userId = localStorage.getItem("userId") || "anonymous"

  for (let i = 14; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    // Skip some days to make it look more realistic
    if (i % 3 === 0) continue

    // Pick a random emotion
    const emotion = emotions[Math.floor(Math.random() * emotions.length)]

    // Generate a random confidence between 0.6 and 1.0
    const confidence = 0.6 + Math.random() * 0.4

    result.push({
      id: `sample-${i}`,
      user_id: userId, // Add user_id to sample data
      date: date.toISOString().split("T")[0],
      emotion,
      confidence,
      created_at: new Date().toISOString(),
    })
  }

  return result
}

// Helper function to get random activities for sample data
function getRandomActivities(): string[] {
  const allActivities = [
    "Exercise",
    "Reading",
    "Studying",
    "Socializing",
    "Gaming",
    "Cooking",
    "Cleaning",
    "Working",
    "Shopping",
    "Meditating",
    "Watching TV",
    "Family time",
    "Outdoor activity",
    "Creative hobby",
    "Music",
  ]

  const numActivities = Math.floor(Math.random() * 4) // 0-3 activities
  const activities: string[] = []

  for (let i = 0; i < numActivities; i++) {
    const randomIndex = Math.floor(Math.random() * allActivities.length)
    const activity = allActivities[randomIndex]

    if (!activities.includes(activity)) {
      activities.push(activity)
    }
  }

  return activities
}

// Function to add a mood entry (stores in localStorage only)
export async function addMood(moodEntry: MoodEntry): Promise<MoodEntry> {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Store in local storage
    const storedMoods = JSON.parse(localStorage.getItem("moods") || "[]")
    const newMood = {
      ...moodEntry,
      id: `local-${Date.now()}`,
      user_id: userId, // Add user_id to the mood entry
      created_at: new Date().toISOString(),
    }
    localStorage.setItem("moods", JSON.stringify([newMood, ...storedMoods]))
    return newMood
  } catch (error) {
    console.error("Error adding mood:", error)
    throw error
  }
}

// Function to add an emotion entry (stores in localStorage only)
export async function addEmotion(emotionEntry: EmotionEntry): Promise<EmotionEntry> {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Store in local storage
    const storedEmotions = JSON.parse(localStorage.getItem("emotions") || "[]")
    const newEmotion = {
      ...emotionEntry,
      id: `local-${Date.now()}`,
      user_id: userId, // Add user_id to the emotion entry
      created_at: new Date().toISOString(),
    }
    localStorage.setItem("emotions", JSON.stringify([newEmotion, ...storedEmotions]))
    return newEmotion
  } catch (error) {
    console.error("Error adding emotion:", error)
    throw error
  }
}

export const updateMood = async (id: string, moodData: Partial<any>) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing moods from localStorage
    const existingMoods = JSON.parse(localStorage.getItem("moods") || "[]")

    // Find the mood to update - must belong to current user
    const index = existingMoods.findIndex((mood) => mood.id === id && mood.user_id === userId)

    if (index === -1) {
      throw new Error("Mood not found")
    }

    // Update the mood
    existingMoods[index] = {
      ...existingMoods[index],
      ...moodData,
      updated_at: new Date().toISOString(),
    }

    // Save back to localStorage
    localStorage.setItem("moods", JSON.stringify(existingMoods))

    return existingMoods[index]
  } catch (error) {
    console.error("Error updating mood:", error)
    throw error
  }
}

export const deleteMood = async (id: string) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing moods from localStorage
    const existingMoods = JSON.parse(localStorage.getItem("moods") || "[]")

    // Filter out the mood to delete - must belong to current user
    const updatedMoods = existingMoods.filter((mood) => !(mood.id === id && mood.user_id === userId))

    // Save back to localStorage
    localStorage.setItem("moods", JSON.stringify(updatedMoods))

    return true
  } catch (error) {
    console.error("Error deleting mood:", error)
    throw error
  }
}

// Emotion detection functions
export const saveEmotion = async (emotionData: any) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing emotions from localStorage
    const existingEmotions = JSON.parse(localStorage.getItem("emotions") || "[]")

    // Create new emotion entry
    const newEmotion = {
      id: generateId(),
      user_id: userId,
      ...emotionData,
      created_at: new Date().toISOString(),
    }

    // Add to existing emotions
    existingEmotions.push(newEmotion)

    // Save back to localStorage
    localStorage.setItem("emotions", JSON.stringify(existingEmotions))

    return newEmotion
  } catch (error) {
    console.error("Error saving emotion:", error)
    throw error
  }
}

export const getEmotionsFromLocalStorage = async (limit = 20) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get emotions from localStorage
    const emotions = JSON.parse(localStorage.getItem("emotions") || "[]")

    // Filter by user ID and limit
    return emotions
      .filter((emotion) => emotion.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  } catch (error) {
    console.error("Error fetching emotions:", error)
    return []
  }
}

// User preferences functions
export const savePreference = async (key: string, value: any) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get existing preferences from localStorage
    const existingPrefs = JSON.parse(localStorage.getItem("preferences") || "{}")

    // Set preference for user
    if (!existingPrefs[userId]) {
      existingPrefs[userId] = {}
    }

    existingPrefs[userId][key] = value

    // Save back to localStorage
    localStorage.setItem("preferences", JSON.stringify(existingPrefs))

    return { key, value }
  } catch (error) {
    console.error("Error saving preference:", error)
    throw error
  }
}

export const getPreference = async (key: string) => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem("preferences") || "{}")

    // Return preference for user and key
    return preferences[userId]?.[key] || null
  } catch (error) {
    console.error("Error fetching preference:", error)
    return null
  }
}

export const getAllPreferences = async () => {
  try {
    // Get current user ID from localStorage
    const userId = localStorage.getItem("userId") || "anonymous"

    // Get preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem("preferences") || "{}")

    // Return all preferences for user
    return preferences[userId] || {}
  } catch (error) {
    console.error("Error fetching preferences:", error)
    return {}
  }
}

// File storage functions
export const uploadFile = async (file: File, path: string) => {
  // This is a placeholder function that returns a placeholder URL
  // In a real implementation, you would upload the file to a storage service
  return {
    path: `${path}/${file.name}`,
    url: `/placeholder.svg?height=480&width=640&text=File+Upload`,
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

export const uploadEmotionImage = async (file: File | Blob, timestamp: string) => {
  // This is a placeholder function that returns a placeholder URL
  // In a real implementation, you would upload the file to a storage service
  const fileExt = file instanceof File ? file.name.split(".").pop() : "png"
  const fileName = `emotion-${timestamp}.${fileExt}`

  return {
    path: `emotions/${fileName}`,
    url: `/placeholder.svg?height=480&width=640&text=Emotion+${timestamp}`,
    name: fileName,
  }
}
