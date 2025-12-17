"use client"

import type { Project, Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Edit2, Save, Calendar, User, Clock, AlertCircle } from "lucide-react"
import { useState } from "react"
import { updateProject } from "@/lib/storage"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface MSProjectTaskDetailsProps {
  project: Project
  taskId: string
  onClose: () => void
  onUpdate: (project: Project) => void
}

export function MSProjectTaskDetails({ project, taskId, onClose, onUpdate }: MSProjectTaskDetailsProps) {
  const task = project.tasks.find(t => t.id === taskId)
  const networkResult = NetworkDiagramService.calculateCriticalPath(project)
  const schedule = networkResult.scheduleData.get(taskId)

  if (!task) return null

  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task>(task)

  const handleSave = () => {
    const updatedTasks = project.tasks.map(t =>
      t.id === taskId ? editedTask : t
    )
    const updatedProject = { ...project, tasks: updatedTasks }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      updateProject(finalProject)
      onUpdate(finalProject)
    }

    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "inProgress": return "bg-blue-100 text-blue-800"
      case "blocked": return "bg-red-100 text-red-800"
      case "deferred": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 p-4 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-lg">Task Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isEditing ? (
          <>
            {/* Task Name */}
            <div>
              <Label className="text-xs text-gray-500">Task Name</Label>
              <p className="font-semibold mt-1">{task.name}</p>
            </div>

            {/* WBS Code */}
            <div>
              <Label className="text-xs text-gray-500">WBS Code</Label>
              <p className="mt-1">{task.wbsCode}</p>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Priority</Label>
                <div className="mt-1">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </Label>
              <p className="mt-1">{task.duration} days</p>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Dates
              </Label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start:</span>
                  <span>{formatDate(task.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Finish:</span>
                  <span>{formatDate(task.endDate)}</span>
                </div>
                {task.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due:</span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Critical Path Info */}
            {schedule && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Schedule Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Early Start:</span>
                    <span>{schedule.earlyStart}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Early Finish:</span>
                    <span>{schedule.earlyFinish}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Late Start:</span>
                    <span>{schedule.lateStart}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Late Finish:</span>
                    <span>{schedule.lateFinish}d</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Float:</span>
                    <span className={schedule.totalFloat === 0 ? "font-bold text-red-600" : ""}>
                      {schedule.totalFloat}d
                    </span>
                  </div>
                  {schedule.isCritical && (
                    <div className="pt-2 border-t">
                      <Badge className="bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Critical Task
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resource */}
            {task.resource && (
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Resource
                </Label>
                <p className="mt-1">{task.resource}</p>
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="mt-1 text-sm text-gray-700">{task.description}</p>
              </div>
            )}

            {/* Progress */}
            <div>
              <Label className="text-xs text-gray-500">Progress</Label>
              <div className="mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${task.progress || 0}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{task.progress || 0}% Complete</p>
              </div>
            </div>

            {/* Dependencies */}
            {task.dependencies && task.dependencies.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500">Dependencies</Label>
                <div className="mt-1 space-y-1">
                  {task.dependencies.map((depId) => {
                    const depTask = project.tasks.find(t => t.id === depId)
                    return depTask ? (
                      <div key={depId} className="text-sm text-gray-700">
                        {depTask.wbsCode}: {depTask.name}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <Button onClick={() => setIsEditing(true)} className="w-full">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Task
            </Button>
          </>
        ) : (
          <>
            <div>
              <Label>Task Name</Label>
              <Input
                value={editedTask.name}
                onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={editedTask.duration}
                onChange={(e) => setEditedTask({ ...editedTask, duration: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="notStarted">Not Started</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <Label>Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editedTask.progress || 0}
                onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

