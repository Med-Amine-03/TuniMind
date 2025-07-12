"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Share2, Bookmark, BookmarkCheck, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import tips from "@/data/self-care-tips.json"

import { useAuth } from "@/contexts/auth-context"

// Categories for tabs
const categories = [...Array.from(new Set(tips.map((tip) => tip.category)))]

export default function SelfCarePage() {
  const { user, loading } = useAuth();
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

  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [savedTips, setSavedTips] = useState<string[]>([])
  const { toast } = useToast()
  const [selectedTip, setSelectedTip] = useState<(typeof tips)[0] | null>(null)

  const handleSaveTip = (tipId: string) => {
    if (savedTips.includes(tipId)) {
      setSavedTips(savedTips.filter((id) => id !== tipId))
      toast({
        title: "Tip Removed",
        description: "The tip has been removed from your saved collection.",
      })
    } else {
      setSavedTips([...savedTips, tipId])
      toast({
        title: "Tip Saved",
        description: "The tip has been added to your saved collection.",
      })
    }
  }

  const handleShareTip = (tip: (typeof tips)[0]) => {
    toast({
      title: "Share Tip",
      description: `Sharing functionality for "${tip.title}" would be implemented here.`,
    })
  }

  const handleOpenTipDetails = (tip: (typeof tips)[0]) => {
    setSelectedTip(tip)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Self-Care Tips</h1>

      <Tabs defaultValue={categories[0]} value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-6 flex flex-wrap h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
          {savedTips.length > 0 && <TabsTrigger value="saved">Saved ({savedTips.length})</TabsTrigger>}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips
                .filter((tip) => tip.category === category)
                .map((tip) => (
                  <Card key={tip.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={tip.imageUrl || "/placeholder.svg"}
                        alt={tip.title}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="default"
                        size="icon"
                        className="absolute bottom-4 right-4 rounded-full"
                        onClick={() => handleOpenTipDetails(tip)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle>{tip.title}</CardTitle>
                      <CardDescription>{tip.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{tip.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="ghost" size="sm" onClick={() => handleSaveTip(tip.id)}>
                        {savedTips.includes(tip.id) ? (
                          <BookmarkCheck className="h-4 w-4 mr-2" />
                        ) : (
                          <Bookmark className="h-4 w-4 mr-2" />
                        )}
                        {savedTips.includes(tip.id) ? "Saved" : "Save"}
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleShareTip(tip)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenTipDetails(tip)}>
                          <Play className="h-4 w-4 mr-2" />
                          Video
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}

        {savedTips.length > 0 && (
          <TabsContent value="saved" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips
                .filter((tip) => savedTips.includes(tip.id))
                .map((tip) => (
                  <Card key={tip.id} className="overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={tip.imageUrl || "/placeholder.svg"}
                        alt={tip.title}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="default"
                        size="icon"
                        className="absolute bottom-4 right-4 rounded-full"
                        onClick={() => handleOpenTipDetails(tip)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle>{tip.title}</CardTitle>
                      <CardDescription>{tip.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{tip.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="ghost" size="sm" onClick={() => handleSaveTip(tip.id)}>
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        Saved
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleShareTip(tip)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenTipDetails(tip)}>
                          <Play className="h-4 w-4 mr-2" />
                          Video
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Daily Self-Care Tip</CardTitle>
          <CardDescription>A new tip every day to improve your wellbeing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-full p-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Take a Nature Break</h3>
              <p className="text-sm text-muted-foreground">
                Spend at least 20 minutes outside today. Research shows that connecting with nature reduces stress
                hormones and improves mood.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip Video Modal */}
      <Dialog
        open={!!selectedTip}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTip(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTip?.title}</DialogTitle>
            <DialogDescription>{selectedTip?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTip?.youtubeId && (
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedTip.youtubeId}?rel=0`}
                  title={selectedTip.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => handleSaveTip(selectedTip?.id || "")}>
                {savedTips.includes(selectedTip?.id || "") ? (
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                {savedTips.includes(selectedTip?.id || "") ? "Saved" : "Save Tip"}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => handleShareTip(selectedTip!)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
