"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Plus,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign
} from "lucide-react"
import type { Project } from "@/lib/types"
import { getProjects } from "@/lib/storage"
import Link from "next/link"

interface MyPlansViewProps {
  userId?: string
}

export function MyPlansView({ userId = "current-user" }: MyPlansViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "on-hold">("all")

  const projects = getProjects()

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Search filter
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false
      }

      // User filter (show projects user is member of or owns)
      if (project.ownerId !== userId && !project.members?.includes(userId)) {
        return false
      }

      return true
    })
  }, [projects, searchQuery, statusFilter, userId])

  // Calculate project statistics
  const getProjectStats = (project: Project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === "completed").length
    const inProgressTasks = project.tasks.filter(t => t.status === "inProgress").length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const totalBudget = project.budget
    const spent = project.tasks.reduce((sum, task) => {
      if (task.status === "completed" || task.status === "inProgress") {
        return sum + (task.cost * (task.progress || 0) / 100)
      }
      return sum
    }, 0)
    const budgetProgress = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0

    const today = new Date()
    const startDate = new Date(project.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + project.duration)

    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysTotal = project.duration
    const timeProgress = daysTotal > 0 ? Math.round((daysElapsed / daysTotal) * 100) : 0

    const overdueTasks = project.tasks.filter(task => {
      if (!task.dueDate || task.status === "completed") return false
      return new Date(task.dueDate) < today
    }).length

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      progress,
      budgetProgress,
      timeProgress,
      overdueTasks,
      spent,
      totalBudget
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "on-hold": return "bg-yellow-500"
      case "draft": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="gradient-card border-l-4 border-l-primary shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">My Plans</CardTitle>
              <CardDescription>
                All team and organizational plans you're part of ({filteredProjects.length} plans)
              </CardDescription>
            </div>
            <Button className="gap-2 gradient-primary">
              <Plus className="size-4" />
              New Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 rounded-md border border-border bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => {
          const stats = getProjectStats(project)

          return (
            <Link key={project.id} href={`/project/${project.id}`}>
              <Card className="gradient-card border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Task Progress</span>
                        <span className="font-semibold">{stats.progress}%</span>
                      </div>
                      <Progress value={stats.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>{stats.completedTasks} / {stats.totalTasks} tasks</span>
                        <span>{stats.inProgressTasks} in progress</span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="size-3" />
                          Budget
                        </span>
                        <span className="font-semibold">
                          ${stats.spent.toLocaleString()} / ${stats.totalBudget.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={stats.budgetProgress} className="h-2" />
                    </div>

                    {/* Timeline */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          Timeline
                        </span>
                        <span className="font-semibold">{stats.timeProgress}%</span>
                      </div>
                      <Progress value={stats.timeProgress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(project.startDate).toLocaleDateString()} - {new Date(new Date(project.startDate).getTime() + project.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">{stats.totalTasks}</div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-chart-4">{project.members?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Members</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${stats.overdueTasks > 0 ? "text-destructive" : "text-green-600"}`}>
                          {stats.overdueTasks}
                        </div>
                        <div className="text-xs text-muted-foreground">Overdue</div>
                      </div>
                    </div>

                    {/* Critical Path Indicator */}
                    {project.criticalPath && project.criticalPath.length > 0 && (
                      <div className="pt-2 border-t">
                        <Badge variant="destructive" className="text-xs">
                          {project.criticalPath.length} Critical Tasks
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="gradient-card">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No plans found</p>
            <Button className="gap-2">
              <Plus className="size-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

