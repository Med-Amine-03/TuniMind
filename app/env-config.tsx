// Create a new file to display environment variables status
"use client"

import { useEffect, useState } from "react"

export function useEnvironmentStatus() {
  const [status, setStatus] = useState({
    supabaseUrl: "",
    supabaseKeyAvailable: false,
    typoDetected: false,
    isConfigured: false,
  })

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPPERBASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPPERBASE_ANON_KEY || ""

    // Check if the typo version is being used
    const typoDetected = !process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPPERBASE_URL

    setStatus({
      supabaseUrl: supabaseUrl,
      supabaseKeyAvailable: !!supabaseKey,
      typoDetected,
      isConfigured: !!supabaseUrl && !!supabaseKey,
    })
  }, [])

  return status
}

export function EnvironmentStatus() {
  const status = useEnvironmentStatus()

  if (!status.isConfigured) {
    return (
      <div className="p-4 border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
        <h3 className="text-lg font-medium mb-2">Environment Configuration</h3>
        <p className="mb-2">Supabase environment variables are not properly configured.</p>

        {status.typoDetected && (
          <div className="mb-2 text-orange-600 dark:text-orange-400">
            <strong>Note:</strong> The environment variable has a typo. It should be "SUPABASE" not "SUPPERBASE".
          </div>
        )}

        <ul className="list-disc pl-5 mb-4">
          <li>Supabase URL: {status.supabaseUrl ? "✅ Set" : "❌ Not set"}</li>
          <li>Supabase Anon Key: {status.supabaseKeyAvailable ? "✅ Set" : "❌ Not set"}</li>
        </ul>

        <p className="text-sm">
          The application will use mock data for visualization. Authentication will use local storage in development
          mode.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 border border-green-500 bg-green-50 dark:bg-green-900/20 rounded-md">
      <h3 className="text-lg font-medium mb-2">Environment Configuration</h3>
      <p className="mb-2">Supabase environment variables are properly configured.</p>
      <ul className="list-disc pl-5">
        <li>Supabase URL: ✅ Set</li>
        <li>Supabase Anon Key: ✅ Set</li>
      </ul>
    </div>
  )
}
