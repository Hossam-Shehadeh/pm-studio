"use client"

import { useState } from "react"
import type { Project, Task } from "@/lib/types"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface MSProjectTaskSheetViewProps {
  project: Project
  selectedTaskId: string | null
  onTaskSelect: (taskId: string | null) => void
  onShowTaskDetails: (show: boolean) => void
  onProjectUpdate?: (project: Project) => void
}

export function MSProjectTaskSheetView({
  project,
  selectedTaskId,
  onTaskSelect,
  onShowTaskDetails,
  onProjectUpdate
}: MSProjectTaskSheetViewProps) {
  const networkResult = NetworkDiagramService.calculateCriticalPath(project)
  const criticalTasks = new Set(networkResult.criticalPath)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 z-10">
          <tr>
            <th className="p-2 text-left border-r border-gray-300 font-semibold">ID</th>
            <th className="p-2 text-left border-r border-gray-300 font-semibold">Task Name</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Duration</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Start</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Finish</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Resource</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">% Complete</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">ES</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">EF</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">LS</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">LF</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Float</th>
            <th className="p-2 text-center font-semibold">Critical</th>
          </tr>
        </thead>
        <tbody>
          {project.tasks.map((task, index) => {
            const isSelected = selectedTaskId === task.id
            const isCritical = criticalTasks.has(task.id)
            const schedule = networkResult.scheduleData.get(task.id)

            return (
              <tr
                key={task.id}
                className={`hover:bg-blue-50 cursor-pointer transition-colors ${isSelected ? "bg-blue-100" : ""
                  } ${isCritical ? "bg-red-50" : ""}`}
                onClick={() => {
                  onTaskSelect(task.id)
                  onShowTaskDetails(true)
                }}
              >
                <td className="p-2 border-r border-gray-200">{task.wbsCode}</td>
                <td className="p-2 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    {task.isSummary && <span className="text-xs">▼</span>}
                    {task.isMilestone && <span className="text-xs">◆</span>}
                    <span className={isCritical ? "font-bold text-red-600" : ""}>{task.name}</span>
                  </div>
                </td>
                <td className="p-2 text-center border-r border-gray-200">{task.duration}d</td>
                <td className="p-2 text-center border-r border-gray-200">{formatDate(task.startDate)}</td>
                <td className="p-2 text-center border-r border-gray-200">{formatDate(task.endDate)}</td>
                <td className="p-2 text-center border-r border-gray-200">{task.resource || "-"}</td>
                <td className="p-2 text-center border-r border-gray-200">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs">{task.progress || 0}%</span>
                  </div>
                </td>
                <td className="p-2 text-center border-r border-gray-200">{schedule?.earlyStart ?? "-"}</td>
                <td className="p-2 text-center border-r border-gray-200">{schedule?.earlyFinish ?? "-"}</td>
                <td className="p-2 text-center border-r border-gray-200">{schedule?.lateStart ?? "-"}</td>
                <td className="p-2 text-center border-r border-gray-200">{schedule?.lateFinish ?? "-"}</td>
                <td className="p-2 text-center border-r border-gray-200">
                  <span className={schedule?.totalFloat === 0 ? "font-bold text-red-600" : ""}>
                    {schedule?.totalFloat ?? "-"}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {isCritical ? (
                    <span className="text-red-600 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

