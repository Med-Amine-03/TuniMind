import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { EmotionProvider } from "@/contexts/emotion-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { SaveMoodModal } from "@/components/save-mood-modal"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "TuniMind - Mental Health Platform",
  description: "A mental health platform for Tunisian university students",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="tunimind-theme"
        >
          <AuthProvider>
            <EmotionProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 pt-16">{children}</main>
              </div>
              <SaveMoodModal />
              <Toaster />
            </EmotionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
