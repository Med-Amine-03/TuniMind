"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, BarChart2, MessageSquare, Camera, User, Edit } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getMoods, getEmotions } from "@/lib/data-service"

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [moodCount, setMoodCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [emotionCount, setEmotionCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sample data for mood history
  const [moodHistory, setMoodHistory] = useState<any[]>([])

  // Sample data for activity
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
      setBio(profile.bio || "")
      setProfileImage(profile.profile_image_url || null)
    }

    // Load real data counts
    const fetchData = async () => {
      try {
        const moods = await getMoods(100)
        const emotions = await getEmotions(100)

        setMoodCount(moods.length)
        setEmotionCount(emotions.length)
        setChatCount(localStorage.getItem("chatCount") ? Number.parseInt(localStorage.getItem("chatCount") || "0") : 0)

        // Set mood history from real data
        const moodHistoryData = moods.slice(0, 5).map((mood) => ({
          date: mood.date,
          mood: mood.mood,
          note: mood.note || "No notes added",
        }))

        setMoodHistory(moodHistoryData)

        // Create recent activity from combined data
        const activities = []

        // Add mood entries to activities
        for (const mood of moods.slice(0, 3)) {
          activities.push({
            type: "mood",
            date: mood.date,
            description: `Logged mood: ${mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}`,
          })
        }

        // Add emotion entries to activities
        for (const emotion of emotions.slice(0, 2)) {
          activities.push({
            type: "emotion",
            date: emotion.date,
            description: `Detected emotion: ${emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)}`,
          })
        }

        // Sort by date (newest first)
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setRecentActivity(activities.slice(0, 5))
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [profile])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        name,
        bio,
        profile_image_url: profileImage,
      })

      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        // Store the base64 image
        const base64Image = event.target.result as string
        setProfileImage(base64Image)

        toast({
          title: "Image Selected",
          description: "Your profile image has been updated. Save to apply changes.",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Image = event.target.result as string
        setProfileImage(base64Image)
        updateProfile({ ...profile, profile_image_url: base64Image })

        toast({
          title: "Image Selected",
          description: "Your profile image has been updated. Save to apply changes.",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-muted-foreground mb-4">Please log in to view your profile.</p>
              <Button asChild>
                <Link href="/auth">Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Card className="w-full md:w-1/3">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {isEditing ? (
                <div className="relative cursor-pointer group" onClick={handleImageClick}>
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    {profile?.profile_image_url ? (
                      <AvatarImage
                        src={profile.profile_image_url || "/placeholder.svg"}
                        alt={profile?.name || "User"}
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              ) : (
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={profileImage || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="text-2xl">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              )}

              {isEditing ? (
                <div className="w-full space-y-4 mb-4">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>

                  <div className="space-y-2 text-left">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile} disabled={isLoading} className="flex-1">
                      {isLoading ? "Saving..." : "Save Profile"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{profile?.name || "User"}</h2>
                  <p className="text-muted-foreground mb-2">{user.email}</p>
                  <p className="text-sm mb-4">{profile?.bio || "No bio provided yet."}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-2 flex items-center gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Mood Entries</h3>
                  <p className="text-2xl font-bold">{moodCount}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Chat Sessions</h3>
                  <p className="text-2xl font-bold">{chatCount}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <BarChart2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-medium">Emotions Detected</h3>
                  <p className="text-2xl font-bold">{emotionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="mood">Mood History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your mood or using the emotion detection to see your activity here.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="sm">
                      <Link href="/dashboard/mood-tracker">Record Mood</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/emotion-detection">Detect Emotions</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {activity.type === "chat" && <MessageSquare className="h-5 w-5 text-primary" />}
                        {activity.type === "mood" && <BarChart2 className="h-5 w-5 text-primary" />}
                        {activity.type === "emotion" && <Calendar className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>Mood History</CardTitle>
            </CardHeader>
            <CardContent>
              {moodHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-medium mb-2">No Mood Entries Yet</h3>
                  <p className="text-muted-foreground mb-4">Start tracking your mood to see your mood history here.</p>
                  <Button asChild>
                    <Link href="/dashboard/mood-tracker">Record Your First Mood</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {moodHistory.map((entry, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{entry.mood}</p>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{entry.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Your Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {moodCount < 5 ? (
                <div className="text-center py-8">
                  <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <h3 className="text-lg font-medium mb-2">Not Enough Data Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Record at least 5 mood entries to see personalized insights about your emotional patterns.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/mood-tracker">Record Mood</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Mood Patterns</h3>
                    <p className="text-sm text-muted-foreground">
                      Your mood tends to improve on weekends and is most positive in the evenings.
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Stress Triggers</h3>
                    <p className="text-sm text-muted-foreground">
                      Academic deadlines appear to be your main source of stress. Consider using the relaxation tools
                      before deadlines.
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Self-Care Impact</h3>
                    <p className="text-sm text-muted-foreground">
                      Meditation sessions have shown a positive correlation with your mood the following day.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
