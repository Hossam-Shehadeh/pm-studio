"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  MoreVertical
} from "lucide-react"
import type { Project, Task, TaskStatus, TaskPriority } from "@/lib/types"
import { getProjects } from "@/lib/storage"

interface MyTasksViewProps {
  userId?: string
}

export function MyTasksView({ userId = "current-user" }: MyTasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "project" | "dueDate">("status")

  const projects = getProjects()

  // Get all tasks assigned to user
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(({ task, project }) => {
      // Search filter
      if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false
      }

      // Project filter
      if (projectFilter !== "all" && project.id !== projectFilter) {
        return false
      }

      return true
    })
  }, [allTasks, searchQuery, statusFilter, priorityFilter, projectFilter])

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Array<{ task: Task; project: Project }>> = {}

    filteredTasks.forEach(({ task, project }) => {
      let key: string

      switch (groupBy) {
        case "status":
          key = task.status || "notStarted"
          break
        case "priority":
          key = task.priority || "low"
          break
        case "project":
          key = project.name
          break
        case "dueDate":
          if (task.dueDate) {
            const date = new Date(task.dueDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff < 0) key = "Overdue"
            else if (daysDiff === 0) key = "Today"
            else if (daysDiff <= 7) key = "This Week"
            else if (daysDiff <= 30) key = "This Month"
            else key = "Later"
          } else {
            key = "No Due Date"
          }
          break
        default:
          key = "Other"
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push({ task, project })
    })

    return groups
  }, [filteredTasks, groupBy])

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
      {/* Filters */}
      <Card className="gradient-card border-l-4 border-l-primary shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">My Tasks</CardTitle>
          <CardDescription>
            All tasks assigned to you across all projects ({allTasks.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="notStarted">Not Started</SelectItem>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Group By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Group by Status</SelectItem>
                <SelectItem value="priority">Group by Priority</SelectItem>
                <SelectItem value="project">Group by Project</SelectItem>
                <SelectItem value="dueDate">Group by Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Tasks */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([groupName, tasks]) => (
          <Card key={groupName} className="gradient-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {groupName}
                <Badge variant="secondary">{tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map(({ task, project }) => (
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
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {task.description}
                            </p>
                          )}
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

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
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
                        {task.floatDays !== null && task.floatDays !== undefined && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            Float: {task.floatDays}d
                          </div>
                        )}
                        {task.progress !== undefined && (
                          <div className="flex items-center gap-2">
                            <span>Progress: {task.progress}%</span>
                          </div>
                        )}
                      </div>

                      {task.labels && task.labels.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {task.labels.map(label => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="gradient-card">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="size-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No tasks match your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

