"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Menu,
  X,
  Home,
  BarChart2,
  MessageSquare,
  Calendar,
  Headphones,
  Lightbulb,
  Camera,
  User,
  LogOut,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmotionDetector } from "@/components/emotion-detector"
import { useAuth } from "@/contexts/auth-context"
import { SaveMoodModal } from "@/components/save-mood-modal"

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: BarChart2 },
  { name: "Chatbot", href: "/dashboard/chatbot", icon: MessageSquare },
  { name: "Mood Tracker", href: "/dashboard/mood-tracker", icon: Calendar },
  { name: "Relaxation", href: "/dashboard/relaxation", icon: Headphones },
  { name: "Self-Care Tips", href: "/dashboard/self-care", icon: Lightbulb },
  { name: "Emotion Detection", href: "/dashboard/emotion-detection", icon: Camera },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, profile, logout } = useAuth()

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-200",
          isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-background border-b",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  T
                </div>
                <span className="text-xl font-bold gradient-text">TuniMind</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Emotion Detector */}
              <EmotionDetector />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        {profile?.profile_image_url ? (
                          <AvatarImage
                            src={profile.profile_image_url || "/placeholder.svg"}
                            alt={profile?.name || "User"}
                          />
                        ) : (
                          <AvatarFallback>{profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{profile?.name || user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                    <Link href="/auth">Login</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild className="hidden md:flex">
                    <Link href="/auth?signup=true">Sign Up</Link>
                  </Button>
                </>
              )}
              <ModeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b">
            <div className="container mx-auto px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
              {user && (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </>
              )}
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/auth">Login</Link>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/auth?signup=true">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Add SaveMoodModal component */}
      <SaveMoodModal />
    </>
  )
}
