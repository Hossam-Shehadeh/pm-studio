"use client"

import type { Project } from "@/lib/types"

interface MSProjectResourceSheetViewProps {
  project: Project
}

export function MSProjectResourceSheetView({ project }: MSProjectResourceSheetViewProps) {
  // Get unique resources
  const resources = project.resources || []
  const resourceUsage = new Map<string, { tasks: number; totalCost: number; totalHours: number }>()

  project.tasks.forEach(task => {
    if (task.resource) {
      // task.resource stores the role, not the name
      const current = resourceUsage.get(task.resource) || { tasks: 0, totalCost: 0, totalHours: 0 }
      resourceUsage.set(task.resource, {
        tasks: current.tasks + 1,
        totalCost: current.totalCost + task.cost,
        totalHours: current.totalHours + (task.duration * 8), // 8 hours per day
      })
    }
  })

  return (
    <div className="h-full overflow-auto bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-gray-100 border-b-2 border-gray-300 z-10">
          <tr>
            <th className="p-2 text-left border-r border-gray-300 font-semibold">Resource Name</th>
            <th className="p-2 text-left border-r border-gray-300 font-semibold">Type</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Material Label</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Initials</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Group</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Max Units</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Std. Rate</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Ovt. Rate</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Cost/Use</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Accrue At</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Base Calendar</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Tasks</th>
            <th className="p-2 text-center border-r border-gray-300 font-semibold">Total Cost</th>
            <th className="p-2 text-center font-semibold">Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            // Match by role since tasks store role in resource field
            const usage = resourceUsage.get(resource.role) || { tasks: 0, totalCost: 0, totalHours: 0 }
            return (
              <tr key={resource.id} className="hover:bg-blue-50">
                <td className="p-2 border-r border-gray-200 font-medium">{resource.name}</td>
                <td className="p-2 border-r border-gray-200">Work</td>
                <td className="p-2 text-center border-r border-gray-200">-</td>
                <td className="p-2 text-center border-r border-gray-200">
                  {resource.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </td>
                <td className="p-2 text-center border-r border-gray-200">-</td>
                <td className="p-2 text-center border-r border-gray-200">100%</td>
                <td className="p-2 text-center border-r border-gray-200">${resource.rate}/hr</td>
                <td className="p-2 text-center border-r border-gray-200">${resource.rate * 1.5}/hr</td>
                <td className="p-2 text-center border-r border-gray-200">$0.00</td>
                <td className="p-2 text-center border-r border-gray-200">Prorated</td>
                <td className="p-2 text-center border-r border-gray-200">Standard</td>
                <td className="p-2 text-center border-r border-gray-200">{usage.tasks}</td>
                <td className="p-2 text-center border-r border-gray-200">${usage.totalCost.toFixed(2)}</td>
                <td className="p-2 text-center">{usage.totalHours}h</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

