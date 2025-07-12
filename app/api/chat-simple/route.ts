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

    // Get user mood data (simplified for reliability)
    let userContext = "No recent mood data available."
    let emotionContext = "No recent emotion data available."

    try {
      const userMoods = await getMoods(5)
      if (userMoods && userMoods.length > 0) {
        userContext = `Recent moods: ${userMoods.map((m) => `${m.date}: ${m.mood} (${m.intensity}/10)`).join(", ")}`
      }

      const userEmotions = await getEmotions(5)
      if (userEmotions && userEmotions.length > 0) {
        emotionContext = `Recent emotions: ${userEmotions.map((e) => `${e.date}: ${e.emotion} (${e.confidence}%)`).join(", ")}`
      }
    } catch (error) {
      console.error("Error fetching mood/emotion data:", error)
    }

    // Check if this is the special user
    const isSpecialUser = userEmail === "amineothmani56@gmail.com"

    // Create a detailed system message with user profile information
    const systemMessage = `You are a mental health assistant for TuniMind, an app for Tunisian university students.

RULES:
- Do NOT greet the user at the beginning (no "Hi", "Hello", "Salem", etc).
- Start immediately with help or support.
- Be supportive, empathetic, concise, and culturally sensitive.
- Never provide medical diagnoses.
- Speak in a simple and comforting style.
    USER PROFILE:
    - Name: ${userName || "Anonymous user"}
    - Email: ${userEmail || "Not provided"}
    - User ID: ${userId || "Not available"}
    ${userProfile?.bio ? `- Bio: ${userProfile.bio}` : ""}
    ${userProfile?.profileImage ? `- Has profile image: ${userProfile.profileImage}` : ""}
    
    USER MENTAL HEALTH DATA:
    ${userContext}
    ${emotionContext}
    
    ${isSpecialUser ? "NOTE: This is a special user (Amine Othmani). Provide extra detailed and personalized responses." : ""}
    
    INSTRUCTIONS:
    1. Provide supportive, empathetic responses about mental health
    2. Never provide medical diagnoses
    3. Keep responses concise and helpful
    4. If the user appears in crisis, encourage them to seek professional help
    5. Tailor your responses to the user's recent mood and emotion data when relevant
    6. Be respectful of Tunisian cultural context and sensitivities`

    console.log("Sending request to Groq API (non-streaming)...")

    try {
      // Use the Groq API with non-streaming mode
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
            { role: "user", content: message },
          ],
          // No streaming for this fallback endpoint
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

      // Parse the response and return it
      const data = await response.json()
      return NextResponse.json({
        message: data.choices[0].message.content,
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
