// Types for mood data
export type Mood = "happy" | "sad" | "angry" | "anxious" | "neutral" | "excited" | "tired" | "content"

export interface MoodEntry {
  date: string
  mood: Mood
  intensity: number
  note?: string
  activities?: string[]
}

export interface ActivityCorrelation {
  activity: string
  moodCorrelation: {
    mood: Mood
    count: number
  }[]
}

// Mood colors
export const moodColors: Record<Mood, string> = {
  happy: "#4ade80", // green-400
  excited: "#fb923c", // orange-400
  content: "#60a5fa", // blue-400
  neutral: "#94a3b8", // slate-400
  tired: "#a78bfa", // violet-400
  anxious: "#fbbf24", // amber-400
  sad: "#38bdf8", // sky-400
  angry: "#f87171", // red-400
}

// Activity options
export const activityOptions = [
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

// Generate random date within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Generate a random mood
const randomMood = (): Mood => {
  const moods: Mood[] = ["happy", "sad", "angry", "anxious", "neutral", "excited", "tired", "content"]
  return moods[Math.floor(Math.random() * moods.length)]
}

// Generate random activities
const randomActivities = (count: number = Math.floor(Math.random() * 3) + 1): string[] => {
  const shuffled = [...activityOptions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Generate random intensity
const randomIntensity = (): number => {
  return Math.floor(Math.random() * 10) + 1
}

// Generate random note
const randomNote = (mood: Mood): string => {
  const happyNotes = [
    "Had a great day today!",
    "Everything went well.",
    "Feeling optimistic about the future.",
    "Accomplished a lot today.",
    "Enjoyed spending time with friends.",
  ]

  const sadNotes = [
    "Feeling down today.",
    "Things didn't go as planned.",
    "Missing someone special.",
    "Struggling with my studies.",
    "Just a low energy day.",
  ]

  const angryNotes = [
    "Frustrated with my project.",
    "Had an argument with a friend.",
    "Traffic was terrible today.",
    "Someone was rude to me.",
    "Things keep going wrong.",
  ]

  const anxiousNotes = [
    "Worried about upcoming exams.",
    "Feeling overwhelmed with work.",
    "Anxious about my presentation tomorrow.",
    "Too many deadlines approaching.",
    "Can't stop overthinking.",
  ]

  const neutralNotes = [
    "Just an ordinary day.",
    "Nothing special happened.",
    "Going through the motions.",
    "Average day overall.",
    "Neither good nor bad.",
  ]

  const excitedNotes = [
    "Can't wait for the weekend!",
    "Got great news today!",
    "Looking forward to the upcoming event.",
    "Received an excellent grade on my project.",
    "Something wonderful is about to happen.",
  ]

  const tiredNotes = [
    "Didn't sleep well last night.",
    "Long day of studying.",
    "Need to rest more.",
    "Exhausted from work.",
    "Low energy all day.",
  ]

  const contentNotes = [
    "Feeling at peace today.",
    "Enjoyed the simple things.",
    "Had a relaxing day.",
    "Satisfied with my progress.",
    "Grateful for what I have.",
  ]

  const notes: Record<Mood, string[]> = {
    happy: happyNotes,
    sad: sadNotes,
    angry: angryNotes,
    anxious: anxiousNotes,
    neutral: neutralNotes,
    excited: excitedNotes,
    tired: tiredNotes,
    content: contentNotes,
  }

  const moodNotes = notes[mood]
  return moodNotes[Math.floor(Math.random() * moodNotes.length)]
}

// Generate a single mood entry
function generateMoodEntry(date: Date): {
  date: string
  mood: string
  intensity: number
  activities: string[]
  note: string
} {
  const mood = randomMood()
  const intensity = randomIntensity()
  const activityCount = Math.floor(Math.random() * 3) + 1
  const selectedActivities = randomActivities(activityCount)

  // 70% chance to have a note
  const hasNote = Math.random() < 0.7
  const note = hasNote ? randomNote(mood) : ""

  return {
    date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
    mood,
    intensity,
    activities: selectedActivities,
    note,
  }
}

// Generate realistic mood data
export const generateMoodData = (days: number): MoodEntry[] => {
  const data: MoodEntry[] = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  // Create a map of dates to ensure one entry per day
  const dateMap = new Map<string, MoodEntry>()

  // Generate more entries than needed to ensure we have enough unique dates
  for (let i = 0; i < days * 1.5; i++) {
    const date = randomDate(startDate, endDate)
    const dateStr = date.toISOString().split("T")[0]

    // Only add if this date doesn't exist yet
    if (!dateMap.has(dateStr)) {
      const mood = randomMood()
      dateMap.set(dateStr, {
        date: dateStr,
        mood,
        intensity: randomIntensity(),
        note: randomNote(mood),
        activities: randomActivities(),
      })
    }
  }

  // Convert map to array and sort by date
  data.push(...Array.from(dateMap.values()))
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Ensure we have exactly the requested number of days
  // If we have too many, trim the oldest
  if (data.length > days) {
    data.splice(0, data.length - days)
  }
  // If we have too few, add more recent days
  else if (data.length < days) {
    const existingDates = new Set(data.map((entry) => entry.date))
    const missingCount = days - data.length

    for (let i = 0; i < missingCount; i++) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      if (!existingDates.has(dateStr)) {
        const mood = randomMood()
        data.push({
          date: dateStr,
          mood,
          intensity: randomIntensity(),
          note: randomNote(mood),
          activities: randomActivities(),
        })
      }
    }

    // Sort again after adding new entries
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return data
}

// Generate activity correlation data
export const generateActivityCorrelation = (moodData: MoodEntry[]): ActivityCorrelation[] => {
  const activityMap = new Map<string, Map<Mood, number>>()

  // Count occurrences of each activity with each mood
  moodData.forEach((entry) => {
    if (entry.activities) {
      entry.activities.forEach((activity) => {
        if (!activityMap.has(activity)) {
          activityMap.set(activity, new Map<Mood, number>())
        }

        const moodCounts = activityMap.get(activity)!
        moodCounts.set(entry.mood as Mood, (moodCounts.get(entry.mood as Mood) || 0) + 1)
      })
    }
  })

  // Convert to the desired output format
  const result: ActivityCorrelation[] = []

  activityMap.forEach((moodCounts, activity) => {
    const moodCorrelation: { mood: Mood; count: number }[] = []

    moodCounts.forEach((count, mood) => {
      moodCorrelation.push({ mood, count })
    })

    // Sort by count in descending order
    moodCorrelation.sort((a, b) => b.count - a.count)

    result.push({
      activity,
      moodCorrelation,
    })
  })

  // Sort activities by total count
  result.sort((a, b) => {
    const totalA = a.moodCorrelation.reduce((sum, item) => sum + item.count, 0)
    const totalB = b.moodCorrelation.reduce((sum, item) => sum + item.count, 0)
    return totalB - totalA
  })

  return result
}

// Generate mood distribution data
export const generateMoodDistribution = (moodData: MoodEntry[]) => {
  const distribution: Record<Mood, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    neutral: 0,
    excited: 0,
    tired: 0,
    content: 0,
  }

  moodData.forEach((entry) => {
    distribution[entry.mood as Mood]++
  })

  return Object.entries(distribution).map(([mood, count]) => ({
    name: mood,
    value: count,
  }))
}

// Generate mood intensity data for heatmap
export const generateMoodIntensityData = (moodData: MoodEntry[]) => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const result: { day: string; hour: string; value: number; mood: string }[] = []

  // Initialize with zero values
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({
        day: daysOfWeek[day],
        hour: hour.toString(),
        value: 0,
        mood: "neutral",
      })
    }
  }

  // Fill in with actual data
  moodData.forEach((entry) => {
    const date = new Date(entry.date)
    const day = daysOfWeek[date.getDay()]

    // Assign a random hour for demonstration purposes
    const hour = Math.floor(Math.random() * 24).toString()

    // Find the index in our result array
    const index = result.findIndex((item) => item.day === day && item.hour === hour)

    if (index !== -1) {
      result[index].value = entry.intensity
      result[index].mood = entry.mood
    }
  })

  return result
}

async function clearAllData() {
  // Placeholder for clearing all data. Replace with actual implementation.
  console.log("Clearing all data...")
  return Promise.resolve()
}

async function generateSampleData(days: number) {
  // Placeholder for generating sample data. Replace with actual implementation.
  console.log(`Generating sample data for ${days} days...`)
  return Promise.resolve(generateMoodData(days))
}

export async function resetWithSampleData(days = 30) {
  await clearAllData()
  return await generateSampleData(days)
}
