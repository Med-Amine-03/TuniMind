"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function TestGroqAPI() {
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setIsLoading(true)
    setError(null)
    setResult("")

    try {
      // First, test if the environment variable is available
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      if (!apiKey) {
        setError("NEXT_PUBLIC_API_KEY environment variable is not available in the client")
        setIsLoading(false)
        return
      }

      // Test the API connection through our own API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Hello, can you respond with a short greeting?",
          userId: "test-user",
          userName: "Test User",
        }),
      })

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage += ` - ${errorData.error || JSON.stringify(errorData)}`
        } catch (e) {
          // Ignore JSON parsing errors
        }
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      // For streaming responses, we need to read the stream
      const reader = response.body?.getReader()
      if (!reader) {
        setError("Could not get response reader")
        setIsLoading(false)
        return
      }

      let responseText = ""
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        responseText += chunk
      }

      setResult(`API connection successful! Received streaming response.
Sample of response data:
${responseText.slice(0, 200)}...`)
    } catch (err: any) {
      setError(`Request Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Also add a direct test to the Groq API
  const testGroqDirectly = async () => {
    setIsLoading(true)
    setError(null)
    setResult("")

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      if (!apiKey) {
        setError("NEXT_PUBLIC_API_KEY environment variable is not available in the client")
        setIsLoading(false)
        return
      }

      // Make a direct request to the Groq API to test the API key
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello in one sentence." },
          ],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`Direct Groq API test successful!
Response: ${data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2)}`)
      } else {
        setError(`Direct Groq API Error: ${data.error?.message || response.statusText}`)
      }
    } catch (err: any) {
      setError(`Direct Request Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Groq API Connection</CardTitle>
        <CardDescription>This will test both your API route and direct connection to the Groq API</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test 1: Through API Route</h3>
          <Button onClick={testAPI} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing API Route...
              </>
            ) : (
              "Test API Route"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test 2: Direct Groq Connection</h3>
          <Button onClick={testGroqDirectly} disabled={isLoading} variant="outline">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing Direct Connection...
              </>
            ) : (
              "Test Direct Connection"
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md">
            <p className="font-bold">Error:</p>
            <p className="font-mono text-sm whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md">
            <p className="font-bold">Success!</p>
            <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
