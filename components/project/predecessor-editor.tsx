"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Link2 } from "lucide-react"
import type { Task, Project, DependencyType } from "@/lib/types"
import { updateProject } from "@/lib/storage"
import { NetworkDiagramService } from "@/lib/network-diagram-service"

interface PredecessorEditorProps {
  project: Project
  task: Task
  onUpdate: (project: Project) => void
}

const dependencyTypes: { value: DependencyType; label: string; description: string }[] = [
  { value: "finishToStart", label: "FS", description: "Finish-to-Start: Successor starts after predecessor finishes" },
  { value: "startToStart", label: "SS", description: "Start-to-Start: Successor starts when predecessor starts" },
  { value: "finishToFinish", label: "FF", description: "Finish-to-Finish: Successor finishes when predecessor finishes" },
  { value: "startToFinish", label: "SF", description: "Start-to-Finish: Successor finishes when predecessor starts" },
]

export function PredecessorEditor({ project, task, onUpdate }: PredecessorEditorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [selectedType, setSelectedType] = useState<DependencyType>("finishToStart")
  const [lagDays, setLagDays] = useState<string>("0")

  // Get available tasks (exclude current task and its descendants)
  const availableTasks = project.tasks.filter(
    (t) => t.id !== task.id && !task.successors?.includes(t.id)
  )

  // Get current predecessors with their dependency info
  const currentPredecessors = (task.predecessors || []).map((predId) => {
    const predTask = project.tasks.find((t) => t.id === predId)
    // Find dependency info from project dependencies if available
    const dep = (project.dependencies || []).find((d) => d.fromTaskId === predId && d.toTaskId === task.id)
    return {
      id: predId,
      task: predTask,
      type: dep?.type || "finishToStart",
      lagDays: dep?.lagDays || 0,
    }
  })

  const handleAddPredecessor = () => {
    if (!selectedTaskId) return

    const updatedPredecessors = [...(task.predecessors || []), selectedTaskId]
    const updatedTask = {
      ...task,
      predecessors: updatedPredecessors,
    }

    // Update dependencies array
    const newDependency = {
      id: `${selectedTaskId}-${task.id}-${Date.now()}`,
      fromTaskId: selectedTaskId,
      toTaskId: task.id,
      type: selectedType,
      lagDays: parseInt(lagDays) || 0,
    }

    const updatedDependencies = [
      ...(project.dependencies || []),
      newDependency,
    ]

    // Update successors on predecessor task
    const updatedTasks = project.tasks.map((t) => {
      if (t.id === selectedTaskId) {
        return {
          ...t,
          successors: [...(t.successors || []), task.id],
        }
      }
      if (t.id === task.id) {
        return updatedTask
      }
      return t
    })

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      dependencies: updatedDependencies,
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      updateProject(finalProject)
      onUpdate(finalProject)
    }

    // Reset form
    setSelectedTaskId("")
    setSelectedType("finishToStart")
    setLagDays("0")
  }

  const handleRemovePredecessor = (predecessorId: string) => {
    const updatedPredecessors = task.predecessors?.filter((id) => id !== predecessorId) || []
    const updatedTask = {
      ...task,
      predecessors: updatedPredecessors,
    }

    // Remove from dependencies
    const updatedDependencies = (project.dependencies || []).filter(
      (d) => !(d.fromTaskId === predecessorId && d.toTaskId === task.id)
    )

    // Remove from predecessor's successors
    const updatedTasks = project.tasks.map((t) => {
      if (t.id === predecessorId) {
        return {
          ...t,
          successors: t.successors?.filter((id) => id !== task.id) || [],
        }
      }
      if (t.id === task.id) {
        return updatedTask
      }
      return t
    })

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      dependencies: updatedDependencies,
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      updateProject(finalProject)
      onUpdate(finalProject)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="size-5" />
          Predecessors & Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Predecessors */}
        {currentPredecessors.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Current Predecessors:</Label>
            <div className="space-y-2">
              {currentPredecessors.map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{pred.task?.name || `Task ${pred.id}`}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {dependencyTypes.find((dt) => dt.value === pred.type)?.label || "FS"}
                      </Badge>
                      {pred.lagDays !== 0 && (
                        <span>Lag: {pred.lagDays > 0 ? `+${pred.lagDays}` : pred.lagDays} days</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePredecessor(pred.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Predecessor Form */}
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-semibold">Add Predecessor:</Label>
          <div className="grid gap-3">
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {availableTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.wbsCode} - {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Dependency Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DependencyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dependencyTypes.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        <div>
                          <div className="font-semibold">{dt.label}</div>
                          <div className="text-xs text-muted-foreground">{dt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Lag/Lead (days)</Label>
                <Input
                  type="number"
                  value={lagDays}
                  onChange={(e) => setLagDays(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Positive = lag (delay), Negative = lead (overlap)
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddPredecessor}
              disabled={!selectedTaskId}
              className="w-full gap-2"
            >
              <Plus className="size-4" />
              Add Predecessor
            </Button>
          </div>
        </div>

        {/* Dependency Type Help */}
        <div className="pt-4 border-t border-border">
          <Label className="text-xs font-semibold mb-2 block">Dependency Types:</Label>
          <div className="space-y-2 text-xs text-muted-foreground">
            {dependencyTypes.map((dt) => (
              <div key={dt.value} className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs">
                  {dt.label}
                </Badge>
                <span>{dt.description}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

