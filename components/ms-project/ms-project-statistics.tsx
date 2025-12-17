"use client"

import type { Project } from "@/lib/types"
import { NetworkDiagramService } from "@/lib/network-diagram-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Users, DollarSign, Target, AlertCircle, CheckCircle2, Clock } from "lucide-react"

interface MSProjectStatisticsProps {
  project: Project
}

export function MSProjectStatistics({ project }: MSProjectStatisticsProps) {
  const networkResult = NetworkDiagramService.calculateCriticalPath(project)

  // Calculate statistics
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === "completed").length
  const inProgressTasks = project.tasks.filter(t => t.status === "inProgress").length
  const notStartedTasks = project.tasks.filter(t => t.status === "notStarted").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const criticalTasks = networkResult.criticalPath.length
  const tasksWithFloat = project.tasks.filter(t => {
    const schedule = networkResult.scheduleData.get(t.id)
    return schedule && schedule.totalFloat > 0
  }).length

  const totalCost = project.tasks.reduce((sum, t) => sum + t.cost, 0)
  const budgetUtilization = project.budget > 0 ? Math.round((totalCost / project.budget) * 100) : 0

  const overdueTasks = project.tasks.filter(t => {
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date() && t.status !== "completed"
  }).length

  const highPriorityTasks = project.tasks.filter(t => t.priority === "high" || t.priority === "urgent").length

  const startDate = new Date(project.startDate)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + project.duration)
  const today = new Date()
  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const timelineProgress = project.duration > 0 ? Math.round((daysElapsed / project.duration) * 100) : 0

  return (
    <div className="w-80 bg-white border-l border-gray-300 overflow-y-auto p-4 space-y-4">
      <div className="sticky top-0 bg-white pb-4 border-b border-gray-200 z-10">
        <h2 className="text-lg font-semibold text-gray-900">Project Statistics</h2>
      </div>

      {/* Task Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Tasks Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Tasks</span>
            <span className="text-sm font-semibold">{totalTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completed</span>
            <span className="text-sm font-semibold text-green-600">{completedTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">In Progress</span>
            <span className="text-sm font-semibold text-blue-600">{inProgressTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Not Started</span>
            <span className="text-sm font-semibold text-gray-600">{notStartedTasks}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-semibold">{completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Critical Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Critical Tasks</span>
            <span className="text-sm font-semibold text-red-600">{criticalTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tasks with Float</span>
            <span className="text-sm font-semibold text-blue-600">{tasksWithFloat}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Project Duration</span>
            <span className="text-sm font-semibold">{networkResult.projectDuration} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Start Date</span>
            <span className="text-sm font-semibold">{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">End Date</span>
            <span className="text-sm font-semibold">{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Days Elapsed</span>
            <span className="text-sm font-semibold">{Math.max(0, daysElapsed)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Days Remaining</span>
            <span className="text-sm font-semibold">{Math.max(0, daysRemaining)}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Timeline Progress</span>
              <span className="text-sm font-semibold">{timelineProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, timelineProgress))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Budget</span>
            <span className="text-sm font-semibold">${project.budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="text-sm font-semibold">${totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Remaining</span>
            <span className={`text-sm font-semibold ${project.budget - totalCost < 0 ? "text-red-600" : "text-green-600"}`}>
              ${(project.budget - totalCost).toLocaleString()}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Budget Utilization</span>
              <span className="text-sm font-semibold">{budgetUtilization}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${budgetUtilization > 100 ? "bg-red-600" : "bg-green-600"}`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Resources</span>
            <span className="text-sm font-semibold">{project.resources.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Assigned Tasks</span>
            <span className="text-sm font-semibold">
              {project.tasks.filter(t => t.resource).length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(overdueTasks > 0 || highPriorityTasks > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-red-600" />
                <span className="text-gray-700">{overdueTasks} overdue task(s)</span>
              </div>
            )}
            {highPriorityTasks > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-gray-700">{highPriorityTasks} high priority task(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

