"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { BarChart, Activity, Brain, Calendar, MessageSquare, Download, Upload, Database } from "lucide-react"
import Link from "next/link"
import { MoodLineChart } from "@/components/mood-charts/mood-line-chart"
import { MoodDistributionChart } from "@/components/mood-charts/mood-distribution-chart"
import { getMoods, exportData, importData } from "@/lib/data-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { SetupDatabase } from "@/components/setup-database"
// Import the new components at the top of the file
import { MoodWeeklyPattern } from "@/components/mood-charts/mood-weekly-pattern"
import { MoodActivityCorrelation } from "@/components/mood-charts/mood-activity-correlation"

const emotions = [
  { id: "happy", label: "Happy", emoji: "😄" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "angry", label: "Angry", emoji: "😠" },
  { id: "anxious", label: "Anxious", emoji: "😟" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "excited", label: "Excited", emoji: "🤩" },
  { id: "content", label: "Content", emoji: "😌" },
  { id: "tired", label: "Tired", emoji: "😴" },
]

export default function DashboardPage() {
  // All hooks must be called at the top level
  const [activeTab, setActiveTab] = useState("overview")
  const [moodData, setMoodData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
  const [databaseError, setDatabaseError] = useState(false)
  const [showConnectionTest, setShowConnectionTest] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()

  // Function to generate sample data
  const generateSampleData = () => {
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
        date: date.toISOString().split("T")[0],
        mood,
        value: moodValue,
      })
    }

    return data
  }

  // Fetch mood data function
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Use the getMoods function to load data from localStorage
      const data = await getMoods(30)

      // Check if we have data
      if (data.length > 0) {
        setMoodData(
          data.map((entry) => ({
            date: entry.date,
            mood: entry.mood,
            value: entry.intensity,
            activities: entry.activities || [],
          })),
        )
        setDatabaseError(false)
      } else {
        // For users with no data, show empty state
        setMoodData([])
      }
    } catch (error: any) {
      console.error("Error fetching mood data:", error)
      setMoodData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Check authentication status
  useEffect(() => {
    if (!user && !loading) {
      router.push("/auth")
    } else if (user) {
      setIsAuthenticated(true)
      fetchData()
    }
  }, [user, loading, router])

  // Export data handler
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
      link.download = `tunimind-export-${new Date().toISOString().split("T")[0]}.json`
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

  // Import data handlers
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
          fetchData()
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

  const features = [
    {
      title: "Mood Tracker",
      description: "Track your daily mood and identify patterns over time",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/dashboard/mood-tracker",
      color: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Emotion Detection",
      description: "Analyze your facial expressions to detect emotions",
      icon: <Brain className="h-8 w-8 text-primary" />,
      href: "/dashboard/emotion-detection",
      color: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Relaxation Tools",
      description: "Access guided meditations and breathing exercises",
      icon: <Activity className="h-8 w-8 text-primary" />,
      href: "/dashboard/relaxation",
      color: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "AI Chatbot",
      description: "Talk to our AI assistant about your feelings",
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      href: "/dashboard/chatbot",
      color: "bg-yellow-100 dark:bg-yellow-950",
    },
  ]

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (redirect happens in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome{profile?.name ? `, ${profile.name}` : ""}! Track your mental wellbeing and access tools to help you
            feel better.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2 flex-wrap justify-end">
          {databaseError && <SetupDatabase onComplete={fetchData} />}
          <Button onClick={() => router.push("/dashboard/mood-tracker")}>Record Today's Mood</Button>
          <Button variant="outline" size="icon" title="Export Data" onClick={handleExportData} disabled={isExporting}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Import Data" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Test Database Connection"
            onClick={() => setShowConnectionTest(!showConnectionTest)}
          >
            <Database className="h-4 w-4" />
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

      {databaseError && (
        <div className="mb-6 p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <h3 className="text-lg font-medium mb-2">Storage Setup Required</h3>
          <p className="mb-4">
            It looks like the local storage hasn't been initialized yet. Please click the "Setup Storage" button to
            initialize the required storage.
          </p>
          <SetupDatabase onComplete={fetchData} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Mood Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature) => (
              <Link href={feature.href} key={feature.title}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-2">
                  <CardHeader className={`${feature.color} rounded-t-lg`}>
                    <div className="flex justify-between items-start">{feature.icon}</div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {isLoading ? (
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
                <Button onClick={() => router.push("/dashboard/mood-tracker")}>Record Your First Mood</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Mood Trends
                  </CardTitle>
                  <CardDescription>Your mood patterns over the past 30 days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <MoodLineChart data={moodData} />
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Mood Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of your emotional states</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <MoodDistributionChart data={moodData} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Replace the insights tab content with new visualizations */}
        <TabsContent value="insights">
          {isLoading ? (
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
                <Button onClick={() => router.push("/dashboard/mood-tracker")}>Record Your First Mood</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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
                          const emotion = emotions.find((e) => e.id === mostCommonMood)
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

              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle>Weekly Mood Patterns</CardTitle>
                  <CardDescription>See how your mood varies by day of the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <MoodWeeklyPattern data={moodData} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle>Activity Impact</CardTitle>
                    <CardDescription>How different activities affect your mood</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <MoodActivityCorrelation data={moodData} />
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle>Mood Distribution</CardTitle>
                    <CardDescription>Breakdown of your emotional states</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <MoodDistributionChart data={moodData} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
