"use client"

import { useMemo, useState } from "react"
import type { Project, Task } from "@/lib/types"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface MSProjectGanttViewProps {
  project: Project
  selectedTaskId: string | null
  onTaskSelect: (taskId: string | null) => void
  onShowTaskDetails: (show: boolean) => void
  onProjectUpdate?: (project: Project) => void
  zoomLevel?: number
  showCriticalPath?: boolean
  showBaseline?: boolean
  showSlack?: boolean
}

export function MSProjectGanttView({
  project,
  selectedTaskId,
  onTaskSelect,
  onShowTaskDetails,
  onProjectUpdate,
  zoomLevel = 1,
  showCriticalPath = true,
  showBaseline = false,
  showSlack = false
}: MSProjectGanttViewProps) {

  const networkResult = useMemo(() => {
    return NetworkDiagramService.calculateCriticalPath(project)
  }, [project.tasks, project.dependencies])

  const criticalTasks = new Set(networkResult.criticalPath)
  const scheduleData = networkResult.scheduleData

  const startDate = new Date(project.startDate)
  const daysToShow = Math.max(project.duration, 30)
  const dayWidth = 20 * (zoomLevel || 1)

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate)
    const daysFromStart = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysFromStart * dayWidth
  }

  const getTaskWidth = (task: Task) => {
    return task.duration * dayWidth
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Split View: Task List + Gantt Chart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Task List (Left Panel) */}
        <div className="w-80 border-r border-gray-300 overflow-y-auto bg-white">
          <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-2 font-semibold text-sm">
            Task Name
          </div>
          <div className="divide-y divide-gray-200">
            {project.tasks.map((task) => {
              const isSelected = selectedTaskId === task.id
              const isCritical = criticalTasks.has(task.id)
              const schedule = scheduleData.get(task.id)
              return (
                <div
                  key={task.id}
                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? "bg-blue-100 border-l-4 border-blue-600" : ""
                    } ${isCritical && showCriticalPath ? "bg-red-50" : ""}`}
                  onClick={() => {
                    onTaskSelect(task.id)
                    onShowTaskDetails(true)
                  }}
                  onDoubleClick={() => {
                    onTaskSelect(task.id)
                    onShowTaskDetails(true)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {task.isSummary && (
                      <span className="text-xs text-gray-500">▼</span>
                    )}
                    {task.isMilestone && (
                      <span className="text-xs">◆</span>
                    )}
                    <span className={`text-sm ${isCritical && showCriticalPath ? "font-bold text-red-600" : ""}`}>
                      {task.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {task.duration}d • {task.resource || "Unassigned"}
                    {showSlack && schedule && schedule.totalFloat > 0 && (
                      <span className="ml-2 text-blue-600">Float: {schedule.totalFloat}d</span>
                    )}
                    {showSlack && schedule && schedule.totalFloat === 0 && (
                      <span className="ml-2 text-red-600 font-semibold">Critical</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gantt Chart (Right Panel) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white">
          {/* Timeline Header */}
          <div className="sticky top-0 bg-gray-100 border-b border-gray-300 z-10">
            <div className="flex" style={{ width: `${daysToShow * dayWidth}px` }}>
              {Array.from({ length: daysToShow }, (_, i) => {
                const date = new Date(startDate)
                date.setDate(date.getDate() + i)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={i}
                    className={`border-r border-gray-300 text-xs text-center py-1 ${isWeekend ? "bg-gray-50" : ""
                      } ${isToday ? "bg-blue-100 font-bold" : ""}`}
                    style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                  >
                    <div>{date.getDate()}</div>
                    <div className="text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task Bars */}
          <div className="relative" style={{ height: `${project.tasks.length * 40}px` }}>
            {project.tasks.map((task, index) => {
              const isCritical = criticalTasks.has(task.id)
              const isSelected = selectedTaskId === task.id
              const left = getTaskPosition(task)
              const width = getTaskWidth(task)
              const top = index * 40

              return (
                <div key={task.id} className="absolute" style={{ top: `${top}px`, height: "32px" }}>
                  {/* Task Bar */}
                  <div
                    className={`absolute rounded h-6 flex items-center justify-center text-xs text-white font-semibold cursor-pointer transition-all ${isCritical && showCriticalPath
                      ? "bg-red-600 border-2 border-red-800"
                      : task.isMilestone
                        ? "bg-blue-600 w-6 h-6 rounded-full"
                        : "bg-blue-500 border-2 border-blue-700"
                      } ${isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                    style={{
                      left: `${left}px`,
                      width: task.isMilestone ? "24px" : `${width}px`,
                      minWidth: task.isMilestone ? "24px" : "40px",
                    }}
                    onClick={() => {
                      onTaskSelect(task.id)
                      onShowTaskDetails(true)
                    }}
                    title={`${task.name} - ${task.duration} days`}
                  >
                    {!task.isMilestone && task.duration > 0 && (
                      <span className="px-2 truncate">{task.duration}d</span>
                    )}
                  </div>

                  {/* Dependency Arrows */}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <>
                      {task.dependencies.map((depId) => {
                        const depTask = project.tasks.find(t => t.id === depId)
                        if (!depTask) return null

                        const depLeft = getTaskPosition(depTask)
                        const depWidth = getTaskWidth(depTask)
                        const depTop = project.tasks.findIndex(t => t.id === depId) * 40

                        const fromX = depLeft + depWidth
                        const fromY = depTop + 16
                        const toX = left
                        const toY = top + 16

                        const isDepCritical = criticalTasks.has(depId) && criticalTasks.has(task.id)

                        return (
                          <svg
                            key={`arrow-${depId}-${task.id}`}
                            className="absolute pointer-events-none"
                            style={{ top: 0, left: 0, width: "100%", height: "100%" }}
                          >
                            <defs>
                              <marker
                                id={`arrowhead-${depId}-${task.id}`}
                                markerWidth="10"
                                markerHeight="10"
                                refX="9"
                                refY="3"
                                orient="auto"
                              >
                                <polygon
                                  points="0 0, 10 3, 0 6"
                                  fill={isDepCritical ? "#dc2626" : "#64748b"}
                                />
                              </marker>
                            </defs>
                            <path
                              d={`M ${fromX} ${fromY} L ${toX} ${toY}`}
                              fill="none"
                              stroke={isDepCritical ? "#dc2626" : "#64748b"}
                              strokeWidth={isDepCritical ? 2 : 1.5}
                              strokeDasharray={isDepCritical ? "0" : "5,5"}
                              markerEnd={`url(#arrowhead-${depId}-${task.id})`}
                            />
                          </svg>
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

