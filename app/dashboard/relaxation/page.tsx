"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Clock, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import exercises from "@/data/relaxation-exercises.json"

// Filter categories
const categories = ["All", ...Array.from(new Set(exercises.map((ex) => ex.category)))]

export default function RelaxationPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedExercise, setSelectedExercise] = useState<(typeof exercises)[0] | null>(null)
  const { toast } = useToast()

  const filteredExercises =
    selectedCategory === "All" ? exercises : exercises.filter((ex) => ex.category === selectedCategory)

  const handleSaveExercise = () => {
    if (!selectedExercise) return

    toast({
      title: "Exercise Saved",
      description: `${selectedExercise?.title} has been added to your favorites.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Relaxation & Meditation</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className="rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <img
                src={exercise.imageUrl || "/placeholder.svg"}
                alt={exercise.title}
                className="w-full h-full object-cover"
              />
              <Button
                variant="default"
                size="icon"
                className="absolute bottom-4 right-4 rounded-full"
                onClick={() => setSelectedExercise(exercise)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle>{exercise.title}</CardTitle>
              <CardDescription>{exercise.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                {exercise.duration}
              </div>
              <div className="text-sm text-muted-foreground">{exercise.category}</div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Exercise Modal */}
      <Dialog
        open={!!selectedExercise}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedExercise?.title}</DialogTitle>
            <DialogDescription>{selectedExercise?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedExercise?.youtubeId && (
              <div className="aspect-video bg-muted rounded-md overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${selectedExercise.youtubeId}?rel=0`}
                  title={selectedExercise.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-sm">{selectedExercise?.duration}</div>
              </div>

              <Button variant="outline" size="icon" onClick={handleSaveExercise}>
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Instructions</h3>
              <ol className="space-y-2 list-decimal list-inside">
                {selectedExercise?.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
