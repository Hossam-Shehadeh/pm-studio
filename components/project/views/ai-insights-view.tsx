"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Lightbulb, AlertTriangle, CheckCircle, Sparkles } from "lucide-react"
import type { Project } from "@/lib/types"

interface AIInsightsViewProps {
  project: Project
}

export function AIInsightsView({ project }: AIInsightsViewProps) {
  const insights = [
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Resource Overallocation Detected",
      description:
        "Backend developers are overallocated by 45 hours. Consider adding an additional resource or extending the timeline.",
      priority: "high",
    },
    {
      type: "suggestion",
      icon: Lightbulb,
      title: "Optimize Testing Phase",
      description:
        "Add a 3-day testing buffer between Development and Deployment phases to catch integration issues early.",
      priority: "medium",
    },
    {
      type: "risk",
      icon: AlertCircle,
      title: "Critical Path Risk",
      description:
        "Database setup is on the critical path. Any delay will impact the entire timeline. Consider starting earlier.",
      priority: "high",
    },
    {
      type: "success",
      icon: CheckCircle,
      title: "Budget Alignment",
      description: "Current resource allocation aligns well with typical project budgets for this type of development.",
      priority: "low",
    },
    {
      type: "suggestion",
      icon: TrendingUp,
      title: "Feature Enhancement Opportunity",
      description:
        "Consider adding an AI recommendation engine feature. It aligns with current market trends and adds value.",
      priority: "medium",
    },
  ]

  const getIconColor = (type: string) => {
    switch (type) {
      case "warning":
      case "risk":
        return "text-destructive"
      case "success":
        return "text-green-500"
      case "suggestion":
        return "text-primary"
      default:
        return "text-muted-foreground"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>
      case "medium":
        return <Badge variant="default">Medium Priority</Badge>
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Smart recommendations to optimize your project</CardDescription>
            </div>
            <Button className="gap-2">
              <Sparkles className="size-4" />
              Generate New Insights
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-muted ${getIconColor(insight.type)}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <CardDescription className="text-base">{insight.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    Apply Suggestion
                  </Button>
                  <Button size="sm" variant="outline">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Health Score</CardTitle>
          <CardDescription>AI-calculated overall project health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Timeline</span>
                <span className="font-medium text-green-500">85%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "85%" }} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Budget</span>
                <span className="font-medium text-green-500">92%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: "92%" }} />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Resources</span>
                <span className="font-medium text-yellow-500">68%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: "68%" }} />
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-4xl font-bold">82%</div>
            <div className="text-sm text-muted-foreground">Overall Health Score</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
