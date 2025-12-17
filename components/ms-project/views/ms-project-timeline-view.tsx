"use client"

import { useMemo } from "react"
import type { Project, Task } from "@/lib/types"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface MSProjectTimelineViewProps {
  project: Project
}

export function MSProjectTimelineView({ project }: MSProjectTimelineViewProps) {
  const networkResult = NetworkDiagramService.calculateCriticalPath(project)
  const criticalTasks = new Set(networkResult.criticalPath)

  const startDate = new Date(project.startDate)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + project.duration)

  const timelineTasks = useMemo(() => {
    return project.tasks
      .filter(task => !task.isSummary)
      .sort((a, b) => {
        const aStart = new Date(a.startDate).getTime()
        const bStart = new Date(b.startDate).getTime()
        return aStart - bStart
      })
      .slice(0, 20) // Limit to 20 tasks for timeline
  }, [project.tasks])

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate)
    const daysFromStart = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return (daysFromStart / project.duration) * 100
  }

  const getTaskWidth = (task: Task) => {
    return (task.duration / project.duration) * 100
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Timeline Header */}
      <div className="border-b border-gray-300 p-4">
        <h2 className="text-lg font-semibold">Timeline View</h2>
        <p className="text-sm text-gray-600 mt-1">
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} ({project.duration} days)
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-6">
        <div className="relative" style={{ height: `${timelineTasks.length * 60}px` }}>
          {/* Time Scale */}
          <div className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 mb-4 z-10">
            <div className="relative h-8">
              {Array.from({ length: Math.ceil(project.duration / 7) + 1 }, (_, i) => {
                const weekDate = new Date(startDate)
                weekDate.setDate(weekDate.getDate() + i * 7)
                const position = (i * 7 / project.duration) * 100
                return (
                  <div
                    key={i}
                    className="absolute border-l border-gray-400"
                    style={{ left: `${position}%` }}
                  >
                    <div className="absolute -top-6 left-0 text-xs text-gray-600 whitespace-nowrap">
                      Week {i + 1}
                    </div>
                    <div className="absolute -top-4 left-0 text-xs text-gray-500 whitespace-nowrap">
                      {weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Bars */}
          {timelineTasks.map((task, index) => {
            const isCritical = criticalTasks.has(task.id)
            const left = getTaskPosition(task)
            const width = Math.max(getTaskWidth(task), 2) // Minimum 2% width
            const top = index * 60

            return (
              <div key={task.id} className="absolute" style={{ top: `${top}px`, height: "40px" }}>
                {/* Task Bar */}
                <div
                  className={`absolute rounded h-8 flex items-center px-2 text-xs font-semibold text-white ${isCritical
                      ? "bg-red-600 border-2 border-red-800"
                      : task.isMilestone
                        ? "bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center"
                        : "bg-blue-500 border-2 border-blue-700"
                    }`}
                  style={{
                    left: `${left}%`,
                    width: task.isMilestone ? "32px" : `${width}%`,
                    minWidth: task.isMilestone ? "32px" : "60px",
                  }}
                  title={`${task.name} - ${task.duration} days`}
                >
                  {!task.isMilestone && (
                    <span className="truncate">{task.name}</span>
                  )}
                  {task.isMilestone && <span>◆</span>}
                </div>

                {/* Task Label */}
                <div
                  className="absolute text-xs text-gray-700 font-medium whitespace-nowrap"
                  style={{
                    left: `${left}%`,
                    top: "42px",
                  }}
                >
                  {task.wbsCode}: {task.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

