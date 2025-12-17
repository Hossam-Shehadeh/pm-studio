"use client"

import { useState } from "react"
import type { Project } from "@/lib/types"

interface MSProjectCalendarViewProps {
  project: Project
}

export function MSProjectCalendarView({ project }: MSProjectCalendarViewProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [currentDate, setCurrentDate] = useState(new Date(project.startDate))

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { firstDay, lastDay, daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const getTasksForDate = (date: Date) => {
    return project.tasks.filter(task => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      return date >= taskStart && date <= taskEnd
    })
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Calendar Header */}
      <div className="border-b border-gray-300 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() - 1)
              setCurrentDate(newDate)
            }}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              newDate.setMonth(newDate.getMonth() + 1)
              setCurrentDate(newDate)
            }}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Today
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "month" ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "week" ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1 rounded text-sm ${viewMode === "day" ? "bg-blue-600 text-white" : "border border-gray-300 hover:bg-gray-50"
              }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-300 border border-gray-300">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div key={day} className="bg-gray-100 p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const tasks = getTasksForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            const isWeekend = date.getDay() === 0 || date.getDay() === 6

            return (
              <div
                key={day}
                className={`bg-white min-h-[100px] p-1 border-r border-b border-gray-200 ${isToday ? "bg-blue-50 border-blue-300 border-2" : ""
                  } ${isWeekend ? "bg-gray-50" : ""}`}
              >
                <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : ""}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded truncate ${task.isCriticalPath
                        ? "bg-red-100 text-red-800 border border-red-300"
                        : "bg-blue-100 text-blue-800"
                        }`}
                      title={task.name}
                    >
                      {task.name}
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <div className="text-xs text-gray-500">+{tasks.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

