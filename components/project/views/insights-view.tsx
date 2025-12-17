"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Project } from "@/lib/types"
import { Lightbulb, AlertTriangle, TrendingUp, Users, Clock, Target, Sparkles, CheckCircle2 } from "lucide-react"

interface InsightsViewProps {
  project: Project
}

export function InsightsView({ project }: InsightsViewProps) {
  const criticalPathTasks = project.tasks.filter((t) => t.isCriticalPath)
  const avgUtilization = Math.round(
    project.resources.reduce((sum, r) => {
      const tasks = project.tasks.filter((t) => t.resource === r.role)
      const hours = tasks.reduce((s, t) => s + t.duration * 8, 0)
      return sum + Math.min((hours / (project.duration * 8)) * 100, 100)
    }, 0) / project.resources.length,
  )

  const overloadedResources = project.resources.filter((r) => {
    const tasks = project.tasks.filter((t) => t.resource === r.role)
    const hours = tasks.reduce((s, t) => s + t.duration * 8, 0)
    return (hours / (project.duration * 8)) * 100 > 85
  })

  const insights = [
    {
      type: "success",
      icon: CheckCircle2,
      title: "Project Structure",
      description: `Well-organized WBS with ${project.tasks.length} tasks across ${project.tasks.filter((t) => t.level === 1).length} major phases.`,
      color: "chart-4",
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Critical Path Risk",
      description: `${criticalPathTasks.length} tasks on critical path. Any delay will impact deadline.`,
      color: "chart-5",
    },
    {
      type: "info",
      icon: Users,
      title: "Resource Utilization",
      description: `Average team utilization at ${avgUtilization}%. ${overloadedResources.length > 0 ? `${overloadedResources.length} resources overloaded.` : "Good balance!"}`,
      color: overloadedResources.length > 0 ? "chart-3" : "chart-4",
    },
    {
      type: "suggestion",
      icon: Lightbulb,
      title: "AI Recommendation",
      description: "Consider adding 10% buffer time to testing phase for quality assurance.",
      color: "chart-1",
    },
    {
      type: "suggestion",
      icon: TrendingUp,
      title: "Timeline Optimization",
      description: "Parallelize backend and frontend development to reduce timeline by 15%.",
      color: "chart-2",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-l-4 border-l-primary shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/40">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Project Insights</CardTitle>
              <CardDescription className="text-base">Smart recommendations and analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-1/10 to-chart-1/5 border border-chart-1/30">
              <Target className="size-8 mx-auto mb-2 text-chart-1" />
              <div className="text-2xl font-black bg-gradient-to-r from-chart-1 to-chart-5 bg-clip-text text-transparent">
                {Math.round((1 - criticalPathTasks.length / project.tasks.length) * 100)}%
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Schedule Flexibility</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-4/10 to-chart-4/5 border border-chart-4/30">
              <Clock className="size-8 mx-auto mb-2 text-chart-4" />
              <div className="text-2xl font-black bg-gradient-to-r from-chart-4 to-success bg-clip-text text-transparent">
                {project.duration} days
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Estimated Duration</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/30">
              <TrendingUp className="size-8 mx-auto mb-2 text-chart-2" />
              <div className="text-2xl font-black bg-gradient-to-r from-chart-2 to-info bg-clip-text text-transparent">
                ${Math.round(project.budget / project.duration).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1">Daily Burn Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <Alert
              key={index}
              className={`gradient-card border-l-4 border-l-${insight.color} shadow-lg hover:shadow-xl transition-all`}
            >
              <div
                className={`size-10 rounded-xl bg-gradient-to-br from-${insight.color} to-${insight.color}/80 flex items-center justify-center mb-3 shadow-lg shadow-${insight.color}/30`}
              >
                <Icon className="size-5 text-white" />
              </div>
              <AlertTitle className="text-lg font-bold mb-2">{insight.title}</AlertTitle>
              <AlertDescription className="text-base leading-relaxed">{insight.description}</AlertDescription>
            </Alert>
          )
        })}
      </div>

      {overloadedResources.length > 0 && (
        <Card className="gradient-card border-l-4 border-l-destructive shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Resource Capacity Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overloadedResources.map((resource) => {
                const tasks = project.tasks.filter((t) => t.resource === resource.role)
                const hours = tasks.reduce((s, t) => s + t.duration * 8, 0)
                const utilization = Math.round((hours / (project.duration * 8)) * 100)

                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-destructive/10 to-chart-5/10 border border-destructive/30"
                  >
                    <div>
                      <div className="font-bold text-lg">{resource.name}</div>
                      <div className="text-sm text-muted-foreground">{resource.role}</div>
                    </div>
                    <Badge className="bg-gradient-to-r from-destructive to-chart-5 text-white border-0 text-lg px-4 py-2">
                      {utilization}% Utilized
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
