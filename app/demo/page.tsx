"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Layout, BarChart3, Users, Zap } from "lucide-react"
import { useState } from "react"
import { Footer } from "@/components/footer"

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("wbs")

  const demoData = {
    tasks: [
      { name: "Planning", wbs: "1", days: 7 },
      { name: "Design", wbs: "2", days: 20 },
      { name: "Development", wbs: "3", days: 60 },
    ],
    stats: [
      { label: "Duration", value: "45 days" },
      { label: "Budget", value: "$125K" },
      { label: "Tasks", value: "12" },
    ],
  }

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
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
              Demo
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            See it in action
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {demoData.stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50"
              >
                <div className="text-3xl font-black bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-8 justify-center">
            {[
              { id: "wbs", icon: Layout, label: "WBS" },
              { id: "gantt", icon: BarChart3, label: "Gantt" },
              { id: "resources", icon: Users, label: "Resources" },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-8 min-h-[400px]">
            {activeTab === "wbs" && (
              <div className="space-y-3">
                {demoData.tasks.map((task, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-chart-1 to-chart-5 flex items-center justify-center text-white font-bold">
                        {task.wbs}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{task.name}</div>
                        <div className="text-sm text-muted-foreground">{task.days} days</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "gantt" && (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center space-y-4">
                  <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-chart-2 to-info flex items-center justify-center">
                    <BarChart3 className="size-10 text-white" />
                  </div>
                  <p className="text-muted-foreground">Interactive Gantt chart view</p>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="grid md:grid-cols-3 gap-4">
                {["Project Manager", "UI/UX Designer", "Backend Developer"].map((role, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border/50 text-center"
                  >
                    <div className="size-12 rounded-lg bg-gradient-to-br from-chart-4 to-success mx-auto mb-3 flex items-center justify-center">
                      <Users className="size-6 text-white" />
                    </div>
                    <div className="font-semibold">{role}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gradient-primary shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all text-lg px-12 py-7 gap-3"
              >
                Create Your Project
                <Zap className="size-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

