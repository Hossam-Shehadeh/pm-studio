import Link from "next/link"
import { Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              AI Project Planner
            </span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/features"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/demo"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Demo
            </Link>
          </nav>

          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Project Planner
          </div>
        </div>
      </div>
    </footer>
  )
}

