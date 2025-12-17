"use client"

import type { Project } from "@/lib/types"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface MSProjectStatusBarProps {
  project: Project
}

export function MSProjectStatusBar({ project }: MSProjectStatusBarProps) {
  const networkResult = NetworkDiagramService.calculateCriticalPath(project)
  const criticalTasksCount = networkResult.criticalPath.length
  const totalTasks = project.tasks.length
  const completedTasks = project.tasks.filter(t => t.status === "completed").length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="h-6 bg-[#f3f3f3] border-t border-gray-300 flex items-center justify-between px-4 text-xs text-gray-700">
      <div className="flex items-center gap-4">
        <span>Ready</span>
        <div className="w-px h-4 bg-gray-300" />
        <span>Tasks: {totalTasks}</span>
        <span>Critical: {criticalTasksCount}</span>
        <span>Completed: {completedTasks} ({completionPercentage}%)</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Duration: {project.duration} days</span>
        <span>Budget: ${project.budget.toLocaleString()}</span>
      </div>
    </div>
  )
}

