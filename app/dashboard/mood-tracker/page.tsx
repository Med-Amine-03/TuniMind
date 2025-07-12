"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CalendarIcon, Save, Download, Upload, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { MoodCalendarView } from "@/components/mood-charts/mood-calendar-view"
import { MoodWaveChart } from "@/components/mood-charts/mood-wave-chart"
import { MoodCircularView } from "@/components/mood-charts/mood-circular-view"
import { MoodTimeline } from "@/components/mood-charts/mood-timeline"
import { saveMood, getMoods, exportData, importData, clearAllData } from "@/lib/data-service"
import { useAuth } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Activity options
const activityOptions = [
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

// Mood options with emojis
const moodOptions = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "content", label: "Content", emoji: "😌" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "angry", label: "Angry", emoji: "😠" },
]

export default function MoodTrackerPage() {
  const [activeTab, setActiveTab] = useState("record")
  const [insightTab, setInsightTab] = useState("calendar")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [moodIntensity, setMoodIntensity] = useState(5)
  const [activities, setActivities] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

  // Add state for actual mood data
  const [moodData, setMoodData] = useState<any[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const { toast } = useToast()
  const { user, loading } = useAuth()

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

  // Redirect to auth if not logged in
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!loading && !user) {
      window.location.href = "/auth"
    }
  }, [user, loading])

  // Add useEffect to fetch real data
  const fetchMoodData = useCallback(async () => {
    setIsDataLoading(true)
    try {
      const data = await getMoods(30) // Get last 30 days

      // Format the data for our charts
      const formattedData = data.map((entry) => ({
        date: entry.date,
        mood: entry.mood,
        value: entry.intensity,
        activities: entry.activities || [],
        note: entry.note || "",
      }))

      setMoodData(formattedData)
    } catch (error) {
      console.error("Error loading mood data:", error)
      toast({
        title: "Data Loading Error",
        description: "There was a problem loading your mood data.",
        variant: "destructive",
      })

      // Check if user has special access
      const hasSpecialAccess = localStorage.getItem("specialAccess") === "true"
      if (hasSpecialAccess) {
        // Use sample data for special user
        const sampleData = generateSampleData()
        setMoodData(sampleData)
      } else {
        // Empty data for regular users
        setMoodData([])
      }
    } finally {
      setIsDataLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchMoodData()
  }, [fetchMoodData])

  // Calculate activity data from actual mood data
  const activityData = useMemo(() => {
    if (!moodData || moodData.length === 0) return []
    return moodData.filter((entry) => entry.activities && entry.activities.length > 0)
  }, [moodData])

  // Reset form after saving
  const resetForm = () => {
    setSelectedMood(null)
    setMoodIntensity(5)
    setActivities([])
    setNote("")
    setSelectedDate(new Date())
  }

  // Add a function to refresh data after saving
  const refreshData = async () => {
    resetForm()
    setActiveTab("insights")
    await fetchMoodData()
  }

  // Toggle activity selection
  const toggleActivity = (activity: string) => {
    if (activities.includes(activity)) {
      setActivities(activities.filter((a) => a !== activity))
    } else {
      setActivities([...activities, activity])
    }
  }

  // Get color for mood button
  const getMoodColor = (mood: string) => {
    const selected = selectedMood === mood

    switch (mood) {
      case "happy":
        return selected
          ? "bg-gradient-to-r from-green-500 to-green-400 text-white"
          : "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/70"
      case "excited":
        return selected
          ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
          : "bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-800/70"
      case "content":
        return selected
          ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white"
          : "bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/70"
      case "neutral":
        return selected
          ? "bg-gradient-to-r from-slate-500 to-slate-400 text-white"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/70"
      case "tired":
        return selected
          ? "bg-gradient-to-r from-violet-500 to-violet-400 text-white"
          : "bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-800/70"
      case "anxious":
        return selected
          ? "bg-gradient-to-r from-amber-500 to-amber-400 text-white"
          : "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-800/70"
      case "sad":
        return selected
          ? "bg-gradient-to-r from-sky-500 to-sky-400 text-white"
          : "bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 dark:hover:bg-sky-800/70"
      case "angry":
        return selected
          ? "bg-gradient-to-r from-red-500 to-red-400 text-white"
          : "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-800/70"
      default:
        return selected
          ? "bg-gradient-to-r from-gray-500 to-gray-400 text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/70"
    }
  }

  // Save mood
  const handleSaveMood = async () => {
    if (!selectedMood || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select a mood before saving.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await saveMood({
        date: selectedDate.toISOString().split("T")[0],
        mood: selectedMood,
        intensity: moodIntensity,
        activities,
        note,
      })

      toast({
        title: "Mood Saved",
        description: `Your mood for ${selectedDate.toLocaleDateString()} has been recorded.`,
      })

      // Switch to insights tab after saving
      refreshData()
    } catch (error) {
      console.error("Error saving mood:", error)
      toast({
        title: "Error",
        description: "Failed to save your mood. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Export data
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportData()

      // Create a download link
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `tunimind-export-${format(new Date(), "yyyy-MM-dd")}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Data Exported",
        description: "Your data has been exported successfully.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Import data
  const handleImportClick = () => {
    if (fileInputRef) {
      fileInputRef.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          await importData(data)

          toast({
            title: "Data Imported",
            description: "Your data has been imported successfully.",
          })

          // Refresh the data
          await fetchMoodData()
        } catch (error) {
          console.error("Error parsing import file:", error)
          toast({
            title: "Import Failed",
            description: "The file format is invalid. Please try again with a valid export file.",
            variant: "destructive",
          })
        } finally {
          setIsImporting(false)
        }
      }

      reader.readAsText(file)
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Import Failed",
        description: "There was a problem importing your data.",
        variant: "destructive",
      })
      setIsImporting(false)
    }
  }

  // Clear all data
  const handleClearData = async () => {
    try {
      await clearAllData()

      toast({
        title: "Data Cleared",
        description: "All your data has been cleared successfully.",
      })

      // Refresh the data
      await fetchMoodData()
      setShowClearConfirm(false)
    } catch (error) {
      console.error("Error clearing data:", error)
      toast({
        title: "Clear Failed",
        description: "There was a problem clearing your data.",
        variant: "destructive",
      })
    }
  }

  if (loading || (typeof window !== "undefined" && !user)) {
    return null // or a loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Mood Tracker</h1>
      <p className="text-muted-foreground mb-6">
        Track your mood and emotions to gain insights into your mental wellbeing.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="record">Record Mood</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
              <CardDescription>
                Select your mood and provide additional details to track your emotional wellbeing.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Select Date</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-4">
                      {/* Calendar would go here */}
                      <p>Calendar placeholder</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Select Your Mood</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {moodOptions.map((mood) => (
                    <Button
                      key={mood.value}
                      variant="outline"
                      className={`h-auto py-3 ${getMoodColor(mood.value)} shadow-sm hover:shadow-md transition-all`}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedMood && (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-3">Intensity: {moodIntensity}/10</h3>
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-4 bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-300"
                        style={{ width: `${moodIntensity * 10}%` }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodIntensity}
                      onChange={(e) => setMoodIntensity(Number.parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Intense</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Activities (Optional)</h3>
                    <p className="text-sm text-muted-foreground mb-3">What activities did you engage in today?</p>
                    <div className="flex flex-wrap gap-2">
                      {activityOptions.map((activity) => (
                        <Button
                          key={activity}
                          variant={activities.includes(activity) ? "default" : "outline"}
                          className="rounded-full shadow-sm hover:shadow-md transition-all"
                          onClick={() => toggleActivity(activity)}
                        >
                          {activity}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Notes (Optional)</h3>
                    <Textarea
                      placeholder="Add any additional notes about your mood or day..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSaveMood}
                disabled={!selectedMood || isLoading}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save Mood Entry"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Mood Insights</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting || moodData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting}>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
                ref={(input) => setFileInputRef(input)}
              />
            </div>
          </div>

          {isDataLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading your mood data...</p>
              </div>
            </div>
          ) : moodData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h3 className="text-xl font-medium mb-2">No mood data yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking your mood to see insights here.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => setActiveTab("record")}>Record Your First Mood</Button>
              </div>
            </div>
          ) : (
            <>
              <Tabs value={insightTab} onValueChange={setInsightTab} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="wave">Wave Chart</TabsTrigger>
                  <TabsTrigger value="circular">Distribution</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle>
                      {insightTab === "calendar" && "Mood Calendar"}
                      {insightTab === "wave" && "Mood Wave"}
                      {insightTab === "circular" && "Mood Distribution"}
                      {insightTab === "timeline" && "Mood Timeline"}
                    </CardTitle>
                    <CardDescription>
                      {insightTab === "calendar" && "View your moods on a monthly calendar"}
                      {insightTab === "wave" && "Visualize your mood patterns over time"}
                      {insightTab === "circular" && "See the distribution of your emotional states"}
                      {insightTab === "timeline" && "Track your mood journey chronologically"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {insightTab === "calendar" && <MoodCalendarView data={moodData} />}
                    {insightTab === "wave" && <MoodWaveChart data={moodData} height={350} />}
                    {insightTab === "circular" && <MoodCircularView data={moodData} size={350} />}
                    {insightTab === "timeline" && <MoodTimeline data={moodData} height={350} />}
                  </CardContent>
                </Card>
              </Tabs>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Mood Summary</CardTitle>
                  <CardDescription>Overview of your emotional wellbeing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Most Common Mood</h3>
                      <div className="text-2xl font-bold">
                        {(() => {
                          const moodCounts: Record<string, number> = {}
                          moodData.forEach((entry) => {
                            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
                          })
                          const mostCommonMood =
                            Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
                          const emotion = moodOptions.find((e) => e.value === mostCommonMood)
                          return (
                            <span className="flex items-center gap-2">
                              {emotion?.emoji || "😐"} {emotion?.label || mostCommonMood}
                            </span>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Average Intensity</h3>
                      <div className="text-2xl font-bold">
                        {moodData.length > 0
                          ? (moodData.reduce((sum, entry) => sum + entry.value, 0) / moodData.length).toFixed(1)
                          : "0"}
                        /10
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Entries Recorded</h3>
                      <div className="text-2xl font-bold">{moodData.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for Clearing Data */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your mood tracking data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground">
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Add a function to generate sample data at the end of the file, before the closing brace
// Function to generate sample data
function generateSampleData() {
  const today = new Date()
  const data = []

  // Generate 7 days of data
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))

    // Generate a mood pattern that looks realistic
    let moodValue
    if (i < 2) {
      moodValue = 5 + Math.sin(i) * 1.5 // Around neutral
    } else if (i < 4) {
      moodValue = 7 + Math.sin(i) * 1 // Happier
    } else if (i < 5) {
      moodValue = 4 + Math.sin(i) * 1.5 // Dip
    } else {
      moodValue = 8 + Math.sin(i) * 0.5 // End on a high note
    }

    // Ensure value is between 1 and 10
    moodValue = Math.max(1, Math.min(10, Math.round(moodValue)))

    // Determine mood based on value
    let mood
    if (moodValue >= 8) {
      mood = "happy"
    } else if (moodValue >= 6) {
      mood = "content"
    } else if (moodValue >= 4) {
      mood = "neutral"
    } else if (moodValue >= 2) {
      mood = "sad"
    } else {
      mood = "angry"
    }

    data.push({
      date: format(date, "yyyy-MM-dd"),
      mood,
      value: moodValue,
      formattedDate: format(date, "MMM d"),
      emotion: moodOptions.find((m) => m.value === mood),
    })
  }

  return data
}
