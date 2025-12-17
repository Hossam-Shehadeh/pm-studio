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
  const dayWidth = 60 // Fixed width for resource usage view

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
            {/* Month Header Row */}
            <div className="flex border-b border-gray-300" style={{ width: `${daysToShow * dayWidth}px` }}>
              {(() => {
                const monthRanges: Array<{ start: number; end: number; month: string; year: number }> = []
                let currentMonth = -1
                
                for (let i = 0; i < daysToShow; i++) {
                  const date = new Date(startDate)
                  date.setDate(date.getDate() + i)
                  const month = date.getMonth()
                  
                  if (month !== currentMonth) {
                    if (currentMonth !== -1) {
                      monthRanges[monthRanges.length - 1].end = i - 1
                    }
                    monthRanges.push({
                      start: i,
                      end: daysToShow - 1,
                      month: date.toLocaleDateString('en-US', { month: 'short' }),
                      year: date.getFullYear()
                    })
                    currentMonth = month
                  }
                }
                
                return monthRanges.map((range) => {
                  const width = (range.end - range.start + 1) * dayWidth
                  return (
                    <div
                      key={`month-${range.start}`}
                      className="border-r border-gray-400 bg-gray-200 text-xs font-semibold text-center py-1 px-1"
                      style={{ width: `${width}px`, minWidth: `${width}px` }}
                    >
                      {range.month} {range.year}
                    </div>
                  )
                })
              })()}
            </div>
            
            {/* Day Header Row */}
            <div className="flex" style={{ width: `${daysToShow * dayWidth}px` }}>
              {Array.from({ length: daysToShow }, (_, i) => {
                const date = new Date(startDate)
                date.setDate(date.getDate() + i)
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                const isFirstDayOfMonth = date.getDate() === 1
                const prevDate = i > 0 ? (() => {
                  const d = new Date(startDate)
                  d.setDate(d.getDate() + i - 1)
                  return d
                })() : null
                const monthChanged = prevDate && prevDate.getMonth() !== date.getMonth()
                
                return (
                  <div
                    key={i}
                    className={`border-r border-gray-300 text-xs text-center py-1 px-0.5 ${isWeekend ? "bg-gray-50" : ""
                      } ${monthChanged ? "border-l-2 border-l-blue-400" : ""}`}
                    style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
                  >
                    <div className={`${isFirstDayOfMonth ? "font-semibold" : ""} whitespace-nowrap`}>{date.getDate()}</div>
                    <div className="text-gray-500 text-[10px] whitespace-nowrap">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
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
                <div key={resource} className="flex" style={{ width: `${daysToShow * dayWidth}px` }}>
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
                        style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
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

