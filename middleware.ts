import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  const isAuthenticated = !!session

  // For development, allow access to protected routes
  const isDevelopment = process.env.NODE_ENV === "development"

  // Define protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth")

  // Only redirect authenticated users away from /auth (optional, can be removed if you want to allow access)
  if (isAuthenticated && isAuthRoute) {
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Do NOT redirect unauthenticated users on the server; let client-side handle it
  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
