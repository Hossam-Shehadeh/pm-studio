"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  return (
    <header className="border-b border-border/40 backdrop-blur-xl bg-gradient-to-r from-card via-card to-primary/5 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
            AI Project Planner
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          {pathname !== "/dashboard" && (
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2">
                Dashboard
              </Button>
            </Link>
          )}
          {/* Planner button - commented out per user request */}
          {/* {pathname !== "/planner" && (
            <Link href="/planner">
              <Button variant="ghost" className="gap-2">
                <Sparkles className="size-4" />
                Planner
              </Button>
            </Link>
          )} */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </nav>
      </div>
    </header>
  )
}

