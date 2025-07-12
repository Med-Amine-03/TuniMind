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

  // Redirect logic
  if (!isAuthenticated && isProtectedRoute && !isDevelopment) {
    // Redirect unauthenticated users trying to access protected routes to the login page
    const redirectUrl = new URL("/auth", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthenticated && isAuthRoute) {
    // Redirect authenticated users trying to access auth routes to the dashboard
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
}
