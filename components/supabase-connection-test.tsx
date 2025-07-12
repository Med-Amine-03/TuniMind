"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<any>(null)

  const testConnection = async () => {
    setStatus("loading")
    setMessage("Testing connection to Supabase...")

    try {
      // Try to get the Supabase URL from the client
      const { data: urlData } = await supabaseClient.rpc("get_config", { key: "url" }).catch(() => ({ data: null }))

      // Try to get the current user session
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()

      // Try a simple query to check database access
      const { data: testData, error: testError } = await supabaseClient
        .from("test_connection")
        .select("*")
        .limit(1)
        .catch((err) => ({ data: null, error: err }))

      // Determine status based on results
      if (sessionError) {
        setStatus("error")
        setMessage("Error connecting to Supabase authentication")
        setDetails({
          error: sessionError,
          session: sessionData,
          testData,
          testError,
        })
      } else {
        setStatus("success")
        setMessage("Successfully connected to Supabase!")
        setDetails({
          session: sessionData,
          testData,
          testError,
          url: urlData,
        })
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error connecting to Supabase")
      setDetails({ error })
    }
  }

  // Get environment variable information
  const getEnvInfo = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPPERBASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPPERBASE_ANON_KEY

    return {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : "Not set",
      keyPrefix: supabaseKey ? `${supabaseKey.substring(0, 5)}...` : "Not set",
    }
  }

  const envInfo = getEnvInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>Verify that your Supabase integration is working correctly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Environment Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {envInfo.hasUrl ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Supabase URL:</span>
            </div>
            <div>{envInfo.url}</div>

            <div className="flex items-center gap-2">
              {envInfo.hasKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Supabase Key:</span>
            </div>
            <div>{envInfo.keyPrefix}</div>
          </div>
        </div>

        {status !== "idle" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
              <p className="font-medium">{message}</p>
            </div>

            {details && (
              <div className="text-xs p-2 bg-muted rounded-md overflow-auto max-h-40">
                <pre>{JSON.stringify(details, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testConnection} disabled={status === "loading" || !envInfo.hasUrl || !envInfo.hasKey}>
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
