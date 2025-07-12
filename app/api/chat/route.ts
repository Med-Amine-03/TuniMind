import { NextResponse } from "next/server"
import { getMoods, getEmotions } from "@/lib/data-service"

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { message, userId, userName, userEmail, userProfile } = await request.json()

    // Check if API key is available
    const apiKey = process.env.API_KEY
    if (!apiKey) {
      console.error("API_KEY environment variable is not set")
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Get user mood data (simplified and limited)
    let userContext = ""
    let emotionContext = ""

    try {
      // Limit to only 3 most recent moods
      const userMoods = await getMoods(3)
      if (userMoods && userMoods.length > 0) {
        userContext = `Recent moods: ${userMoods.map((m) => `${m.mood} (${m.intensity}/10)`).join(", ")}`
      }

      // Limit to only 2 most recent emotions
      const userEmotions = await getEmotions(2)
      if (userEmotions && userEmotions.length > 0) {
        emotionContext = `Recent emotions: ${userEmotions.map((e) => `${e.emotion}`).join(", ")}`
      }
    } catch (error) {
      console.error("Error fetching mood/emotion data:", error)
    }

    // Check if this is the special user
    const isSpecialUser = userEmail === "amineothmani56@gmail.com"

    // Create a more concise system message
    const systemMessage = `You are a mental health assistant for TuniMind, an app for Tunisian university students.

RULES:
- Do NOT greet the user at the beginning (no "Hi", "Hello", "Salem", etc).
- Start immediately with help or support.
- Be supportive, empathetic, concise, and culturally sensitive.
- Never provide medical diagnoses.
- Speak in a simple and comforting style.
    USER: ${userName || "Anonymous"} (${userEmail || "No email"})
    ${userContext ? `MOOD: ${userContext}` : ""}
    ${emotionContext ? `EMOTIONS: ${emotionContext}` : ""}
    ${isSpecialUser ? "NOTE: This is Amine Othmani. Provide personalized responses." : ""}
    
    Be supportive, empathetic, concise, and culturally sensitive. Never provide medical diagnoses.`

    // Truncate user message if it's too long (over 1000 characters)
    const truncatedMessage = message.length > 1000 ? message.substring(0, 1000) + "..." : message

    console.log("Sending request to Groq API...")

    try {
      // Use the Groq API directly for more reliability
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: truncatedMessage },
          ],
          stream: true,
          max_tokens: 1000, // Limit response size
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`Groq API error: ${response.status} ${response.statusText}`, errorData)
        return NextResponse.json(
          { error: `Groq API error: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      // Return the response stream directly
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } catch (error) {
      console.error("Error calling Groq API:", error)
      return NextResponse.json({ error: "Failed to call Groq API" }, { status: 500 })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process your message" }, { status: 500 })
  }
}
