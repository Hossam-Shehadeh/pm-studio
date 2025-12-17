"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react"
import type { Project, Task } from "@/lib/types"
import { getProjects } from "@/lib/storage"
import { useMemo } from "react"

interface MyDayViewProps {
  userId?: string
}

export function MyDayView({ userId = "current-user" }: MyDayViewProps) {
  const projects = getProjects()

  // Get all tasks assigned to user across all projects
  const allTasks = useMemo(() => {
    const tasks: Array<{ task: Task; project: Project }> = []
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.assignedTo?.includes(userId)) {
          tasks.push({ task, project })
        }
      })
    })
    return tasks
  }, [projects, userId])

  // AI-suggested focus tasks (prioritize by due date, dependencies, urgency)
  const focusTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allTasks
      .map(({ task, project }) => {
        let priorityScore = 0

        // Due date urgency (closer = higher priority)
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate)
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilDue < 0) priorityScore += 100 // Overdue
          else if (daysUntilDue === 0) priorityScore += 80 // Due today
          else if (daysUntilDue <= 3) priorityScore += 60 // Due soon
          else if (daysUntilDue <= 7) priorityScore += 40
        }

        // Priority level
        if (task.priority === "urgent") priorityScore += 50
        else if (task.priority === "high") priorityScore += 30
        else if (task.priority === "medium") priorityScore += 15

        // Status (in progress gets boost)
        if (task.status === "inProgress") priorityScore += 20
        else if (task.status === "blocked") priorityScore -= 30

        // Dependencies (tasks with many dependencies get priority)
        if (task.predecessors && task.predecessors.length > 0) {
          priorityScore += task.predecessors.length * 5
        }

        // Critical path
        if (task.isCriticalPath) priorityScore += 25

        return { task, project, priorityScore }
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 8) // Top 8 focus tasks
  }, [allTasks])

  // Today's tasks
  const todayTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allTasks.filter(({ task }) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    })
  }, [allTasks])

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allTasks.filter(({ task }) => {
      if (!task.dueDate || task.status === "completed") return false
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() < today.getTime()
    })
  }, [allTasks])

  // Statistics
  const stats = useMemo(() => {
    const total = allTasks.length
    const completed = allTasks.filter(({ task }) => task.status === "completed").length
    const inProgress = allTasks.filter(({ task }) => task.status === "inProgress").length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, completionRate }
  }, [allTasks])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-blue-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600"
      case "inProgress": return "text-blue-600"
      case "blocked": return "text-red-600"
      case "notStarted": return "text-gray-600"
      default: return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="gradient-card border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* AI-Suggested Focus Tasks */}
      <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-chart-1" />
            <CardTitle className="text-xl">AI-Suggested Focus Tasks</CardTitle>
          </div>
          <CardDescription>
            Prioritized based on due dates, dependencies, and urgency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {focusTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="size-12 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned. Great job!</p>
              </div>
            ) : (
              focusTasks.map(({ task, project, priorityScore }) => (
                <div
                  key={task.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{task.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {project.name} • {task.wbsCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(task.priority)} text-white border-0`}
                        >
                          {task.priority}
                        </Badge>
                        {task.isCriticalPath && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className={`flex items-center gap-1 ${getStatusColor(task.status)}`}>
                        <Clock className="size-3" />
                        {task.status}
                      </div>
                      {task.progress !== undefined && (
                        <div className="flex items-center gap-2 flex-1">
                          <Progress value={task.progress} className="h-1.5 flex-1" />
                          <span>{task.progress}%</span>
                        </div>
                      )}
                    </div>

                    {task.predecessors && task.predecessors.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Depends on {task.predecessors.length} task(s)
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="size-5 text-chart-2" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayTasks.map(({ task, project }) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={task.status === "completed"} />
                    <div>
                      <h4 className="font-medium text-sm">{task.name}</h4>
                      <p className="text-xs text-muted-foreground">{project.name}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="gradient-card border-l-4 border-l-destructive shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              Overdue ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.map(({ task, project }) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={task.status === "completed"} />
                    <div>
                      <h4 className="font-medium text-sm">{task.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {project.name} • Due {new Date(task.dueDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

