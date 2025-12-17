import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Sparkles, Layout, Users, DollarSign, TrendingUp, Calendar, Zap, Target } from "lucide-react"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10">
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="size-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              AI Project Planner
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
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
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-chart-1/10 border border-primary/20 text-primary text-sm font-semibold">
            <Zap className="size-4" />
            AI-Powered Project Planning
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-balance">
            Build{" "}
            <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
              Smarter
            </span>{" "}
            Project Plans
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto leading-relaxed">
            Automatically generate comprehensive project schedules, WBS structures, resource allocations, and export to
            Microsoft Project format in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gradient-primary shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all text-lg px-8 py-6 gap-3"
              >
                Start Planning Free
                <ArrowRight className="size-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary/30 hover:border-primary text-lg px-8 py-6 bg-transparent"
              >
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto">
          <Card className="gradient-card border-l-4 border-l-chart-1 hover:shadow-xl hover:shadow-chart-1/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl bg-gradient-to-br from-chart-1 to-chart-5 flex items-center justify-center mb-4 shadow-lg shadow-chart-1/30">
                <Layout className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">Auto WBS Generation</CardTitle>
              <CardDescription className="text-base">
                AI creates multi-level work breakdown structures for any project type instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-l-4 border-l-chart-2 hover:shadow-xl hover:shadow-chart-2/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl bg-gradient-to-br from-chart-2 to-info flex items-center justify-center mb-4 shadow-lg shadow-chart-2/30">
                <Calendar className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">Smart Scheduling</CardTitle>
              <CardDescription className="text-base">
                Intelligent duration estimation and dependency management powered by AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-l-4 border-l-chart-4 hover:shadow-xl hover:shadow-chart-4/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl bg-gradient-to-br from-chart-4 to-success flex items-center justify-center mb-4 shadow-lg shadow-chart-4/30">
                <Users className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">Resource Optimization</CardTitle>
              <CardDescription className="text-base">
                Automatic role assignment and intelligent workload balancing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-l-4 border-l-chart-3 hover:shadow-xl hover:shadow-chart-3/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl bg-gradient-to-br from-chart-3 to-warning flex items-center justify-center mb-4 shadow-lg shadow-chart-3/30">
                <DollarSign className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">Cost Estimation</CardTitle>
              <CardDescription className="text-base">
                AI-powered budget calculation and real-time cost tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-l-4 border-l-primary hover:shadow-xl hover:shadow-primary/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
                <TrendingUp className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">Critical Path Analysis</CardTitle>
              <CardDescription className="text-base">
                Identify bottlenecks and optimize your project timeline automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="gradient-card border-l-4 border-l-chart-5 hover:shadow-xl hover:shadow-chart-5/20 transition-all">
            <CardHeader>
              <div className="size-12 rounded-xl bg-gradient-to-br from-chart-5 to-primary flex items-center justify-center mb-4 shadow-lg shadow-chart-5/30">
                <Target className="size-6 text-white" />
              </div>
              <CardTitle className="text-xl">MPP Export</CardTitle>
              <CardDescription className="text-base">
                Download complete Microsoft Project files instantly with one click
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  )
}
