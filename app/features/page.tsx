import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Layout, Users, DollarSign, Calendar, Zap, BarChart3, FileDown, Brain } from "lucide-react"
import { Footer } from "@/components/footer"

export default function FeaturesPage() {
  const features = [
    { icon: Brain, title: "AI Magic", desc: "Instant project plans" },
    { icon: Layout, title: "Smart WBS", desc: "Auto-generated structure" },
    { icon: Calendar, title: "Perfect Timing", desc: "AI-optimized schedules" },
    { icon: Users, title: "Team Balance", desc: "Resource optimization" },
    { icon: DollarSign, title: "Budget Smart", desc: "Real-time cost tracking" },
    { icon: BarChart3, title: "Visual Charts", desc: "Gantt & analytics" },
    { icon: FileDown, title: "MPP Export", desc: "One-click download" },
    { icon: Zap, title: "Live Updates", desc: "Real-time sync" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              AI Project Planner
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm font-medium text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              How it Works
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="gradient-primary shadow-lg shadow-primary/30">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
              Features
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need, nothing you don't
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = [
                "from-chart-1 to-chart-5",
                "from-chart-2 to-info",
                "from-chart-3 to-warning",
                "from-chart-4 to-success",
                "from-primary to-chart-1",
                "from-chart-5 to-primary",
                "from-chart-1 to-chart-2",
                "from-chart-2 to-chart-3",
              ]
              return (
                <div
                  key={index}
                  className="group relative p-6 rounded-2xl border border-border/50 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                >
                  <div className={`size-14 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="size-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-24">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="gradient-primary shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all text-lg px-12 py-7 gap-3 text-base"
            >
              Start Free
              <Sparkles className="size-5" />
            </Button>
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}

