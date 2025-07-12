import { TestGroqAPI } from "@/components/test-groq-api"

export default function TestAPIPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      <p className="mb-6 text-muted-foreground">
        Use this page to test if your Groq API connection is working correctly.
      </p>
      <TestGroqAPI />
    </div>
  )
}
