"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Brain, Shield, Sparkles, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center space-y-8 py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Welcome to <span className="gradient-text">TuniMind</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            A mental health platform designed specifically for Tunisian university students. Take care of your mental
            wellbeing with our suite of tools and resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href={user ? "/dashboard" : "/auth"}>
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg">
                <Link href="/auth">Login / Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            TuniMind offers a comprehensive suite of tools to support your mental health journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card rounded-lg p-6 shadow-soft border hover:shadow-soft-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
            <p className="text-muted-foreground">
              Talk to our AI assistant about your feelings, get advice, or just have someone to listen.
            </p>
            <Button asChild variant="link" className="mt-4 p-0">
              <Link href={user ? "/dashboard/chatbot" : "/auth"}>Try Now</Link>
            </Button>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-soft border hover:shadow-soft-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mood Tracker</h3>
            <p className="text-muted-foreground">
              Track your mood over time, identify patterns, and gain insights into your emotional wellbeing.
            </p>
            <Button asChild variant="link" className="mt-4 p-0">
              <Link href={user ? "/dashboard/mood-tracker" : "/auth"}>Try Now</Link>
            </Button>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-soft border hover:shadow-soft-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Relaxation Tools</h3>
            <p className="text-muted-foreground">
              Access guided meditations, breathing exercises, and relaxation techniques.
            </p>
            <Button asChild variant="link" className="mt-4 p-0">
              <Link href={user ? "/dashboard/relaxation" : "/auth"}>Try Now</Link>
            </Button>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-soft border hover:shadow-soft-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Emotion Detection</h3>
            <p className="text-muted-foreground">Use your webcam to detect and analyze your emotions in real-time.</p>
            <Button asChild variant="link" className="mt-4 p-0">
              <Link href={user ? "/dashboard/emotion-detection" : "/auth"}>Try Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/30 rounded-xl my-16">
  <div className="text-center mb-12">
    <h2 className="text-3xl font-bold mb-4">What Students Say</h2>
    <p className="text-muted-foreground max-w-2xl mx-auto">
      Hear from Tunisian university students who have used TuniMind.
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
    <div className="bg-card p-6 rounded-lg shadow-soft">
      <p className="italic mb-4">
        "TuniMind helped me manage my exam anxiety. The relaxation tools are amazing!"
      </p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkwiruafD-4A_k3Pq1s0qLoLzRP5LENJ8qFA&s" alt="Amina B." className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-medium">Amina B.</p>
          <p className="text-sm text-muted-foreground">Engineering Student</p>
        </div>
      </div>
    </div>

    <div className="bg-card p-6 rounded-lg shadow-soft">
      <p className="italic mb-4">
        "The mood tracker helped me identify patterns in my emotions and take better care of myself."
      </p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
          <img src="data:image/jpeg;base64,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" alt="Youssef M." className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-medium">Youssef M.</p>
          <p className="text-sm text-muted-foreground">Medical Student</p>
        </div>
      </div>
    </div>

    <div className="bg-card p-6 rounded-lg shadow-soft">
      <p className="italic mb-4">
        "I love chatting with the AI assistant. It feels like having a supportive friend available 24/7."
      </p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full mr-3 overflow-hidden">
          <img src="data:image/jpeg;base64,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" alt="Nour K." className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="font-medium">Nour K.</p>
          <p className="text-sm text-muted-foreground">Psychology Student</p>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to prioritize your mental health?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of Tunisian students who are taking control of their mental wellbeing with TuniMind.
          </p>
          <Button asChild size="lg">
            <Link href={user ? "/dashboard" : "/auth"}>Get Started Now</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
