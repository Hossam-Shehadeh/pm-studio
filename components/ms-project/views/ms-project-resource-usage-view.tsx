"use client"

import { useMemo } from "react"
import type { Project } from "@/lib/types"

interface MSProjectResourceUsageViewProps {
  project: Project
  showOverallocation?: boolean
}

export function MSProjectResourceUsageView({ project, showOverallocation = false }: MSProjectResourceUsageViewProps) {
  const startDate = new Date(project.startDate)
  const daysToShow = Math.max(project.duration, 30)

  // Group tasks by resource and date
  const resourceUsage = useMemo(() => {
    const usage = new Map<string, Map<number, number>>() // resource -> day -> hours

    project.tasks.forEach(task => {
      if (!task.resource) return

      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      // task.resource stores the role string
      const resourceRole = task.resource

      for (let d = 0; d < daysToShow; d++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + d)

        if (date >= taskStart && date <= taskEnd) {
          if (!usage.has(resourceRole)) {
            usage.set(resourceRole, new Map())
          }
          const resourceDays = usage.get(resourceRole)!
          resourceDays.set(d, (resourceDays.get(d) || 0) + 8) // 8 hours per day
        }
      }
    })

    return usage
  }, [project.tasks, startDate, daysToShow])

  const resources = Array.from(resourceUsage.keys())

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="flex">
        {/* Resource Names Column */}
        <div className="w-64 border-r border-gray-300 sticky left-0 bg-white z-10">
          <div className="sticky top-0 bg-gray-100 border-b border-gray-300 p-2 font-semibold text-sm">
            Resource Name
          </div>
          <div className="divide-y divide-gray-200">
            {resources.map((resourceRole) => {
              // Find resource by role to get name
              const resource = project.resources.find(r => r.role === resourceRole)
              return (
                <div key={resourceRole} className="p-3 border-b border-gray-200">
                  <div className="font-medium text-sm">{resource?.name || resourceRole}</div>
                  <div className="text-xs text-gray-500">{resourceRole}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Usage Timeline */}
        <div className="flex-1 overflow-x-auto">
          {/* Timeline Header */}
          <div className="sticky top-0 bg-gray-100 border-b border-gray-300 z-10">
            <div className="flex" style={{ width: `${daysToShow * 60}px` }}>
              {Array.from({ length: daysToShow }, (_, i) => {
                const date = new Date(startDate)
                date.setDate(date.getDate() + i)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                return (
                  <div
                    key={i}
                    className={`border-r border-gray-300 text-xs text-center py-1 ${isWeekend ? "bg-gray-50" : ""
                      }`}
                    style={{ width: "60px", minWidth: "60px" }}
                  >
                    <div>{date.getDate()}</div>
                    <div className="text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resource Rows */}
          <div className="divide-y divide-gray-200">
            {resources.map((resource) => {
              const days = resourceUsage.get(resource) || new Map()
              return (
                <div key={resource} className="flex" style={{ width: `${daysToShow * 60}px` }}>
                  {Array.from({ length: daysToShow }, (_, i) => {
                    const hours = days.get(i) || 0
                    const isOverallocated = hours > 8
                    return (
                      <div
                        key={i}
                        className={`border-r border-gray-200 text-xs text-center py-2 ${hours > 0
                            ? isOverallocated && showOverallocation
                              ? "bg-red-200 border-2 border-red-400"
                              : isOverallocated
                                ? "bg-red-100"
                                : "bg-blue-50"
                            : ""
                          }`}
                        style={{ width: "60px", minWidth: "60px" }}
                      >
                        {hours > 0 && (
                          <div className={`font-semibold ${isOverallocated ? "text-red-600" : "text-blue-600"}`}>
                            {hours}h
                            {isOverallocated && showOverallocation && (
                              <span className="ml-1 text-red-800">⚠</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

