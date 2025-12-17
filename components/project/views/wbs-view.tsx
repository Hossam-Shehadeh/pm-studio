"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, ChevronDown, Plus, Sparkles, Edit2, Trash2, Check, X, Link2 } from "lucide-react"
import type { Project, Task } from "@/lib/types"
import { useState } from "react"
import { updateProject } from "@/lib/storage"
import { RESOURCE_RATES } from "@/lib/constants"
import { PredecessorEditor } from "@/components/project/predecessor-editor"

interface WBSViewProps {
  project: Project
  onUpdate?: () => void
}

export function WBSView({ project, onUpdate }: WBSViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(project.tasks.filter((t) => t.level === 1).map((t) => t.id)),
  )
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; duration: number; cost: number }>({
    name: "",
    duration: 0,
    cost: 0,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTaskForPredecessors, setSelectedTaskForPredecessors] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    name: "",
    duration: 1,
    parentId: "",
    resource: "",
  })

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const startEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task.id)
    setEditValues({ name: task.name, duration: task.duration, cost: task.cost })
  }

  const saveEdit = (taskId: string) => {
    const updatedTasks = project.tasks.map((t) => (t.id === taskId ? { ...t, ...editValues } : t))
    updateProject({ ...project, tasks: updatedTasks })
    setEditingTask(null)
    onUpdate?.()
  }

  const cancelEdit = () => {
    setEditingTask(null)
  }

  const deleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this task and all subtasks?")) {
      const deleteRecursive = (id: string): string[] => {
        const children = project.tasks.filter((t) => t.parentId === id)
        return [id, ...children.flatMap((c) => deleteRecursive(c.id))]
      }
      const toDelete = new Set(deleteRecursive(taskId))
      const updatedTasks = project.tasks.filter((t) => !toDelete.has(t.id))
      updateProject({ ...project, tasks: updatedTasks })
      onUpdate?.()
    }
  }

  const generateWBSCode = (parentId: string | null): string => {
    if (!parentId) {
      // Root level task
      const rootTasks = project.tasks.filter((t) => t.level === 1)
      return `${rootTasks.length + 1}`
    }

    const parent = project.tasks.find((t) => t.id === parentId)
    if (!parent) return "1.1"

    const siblings = project.tasks.filter((t) => t.parentId === parentId)
    const parentParts = parent.wbsCode.split(".")
    return `${parentParts.join(".")}.${siblings.length + 1}`
  }

  const addTask = () => {
    if (!newTask.name || newTask.duration <= 0) return

    const parent = newTask.parentId ? project.tasks.find((t) => t.id === newTask.parentId) : null
    const level = parent ? parent.level + 1 : 1
    const wbsCode = generateWBSCode(newTask.parentId || null)

    // Calculate dates
    let startDate = new Date(project.startDate)
    if (parent) {
      startDate = new Date(parent.startDate)
    } else {
      // Find the latest end date of root tasks
      const rootTasks = project.tasks.filter((t) => t.level === 1)
      if (rootTasks.length > 0) {
        const latestEndDate = rootTasks.reduce((latest, task) => {
          const taskEnd = new Date(task.endDate)
          return taskEnd > latest ? taskEnd : latest
        }, new Date(project.startDate))
        startDate = latestEndDate
      }
    }

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + newTask.duration)

    // Calculate cost
    const rate = newTask.resource
      ? RESOURCE_RATES[newTask.resource as keyof typeof RESOURCE_RATES] || 100
      : 100
    const cost = newTask.duration * 8 * rate

    const task: Task = {
      id: crypto.randomUUID(),
      name: newTask.name,
      wbsCode,
      level,
      parentId: newTask.parentId || null,
      duration: newTask.duration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      resource: newTask.resource || null,
      cost,
      isCriticalPath: false,
      dependencies: [],
    }

    const updatedTasks = [...project.tasks, task]
    updateProject({ ...project, tasks: updatedTasks })
    
    // Expand parent if task has one
    if (parent) {
      setExpandedTasks(new Set([...expandedTasks, parent.id]))
    }

    // Reset form
    setNewTask({ name: "", duration: 1, parentId: "", resource: "" })
    setIsAddDialogOpen(false)
    onUpdate?.()
  }

  const renderTask = (task: Task) => {
    const children = project.tasks.filter((t) => t.parentId === task.id)
    const isExpanded = expandedTasks.has(task.id)
    const hasChildren = children.length > 0
    const isEditing = editingTask === task.id

    return (
      <div key={task.id}>
        <div
          className="flex items-center gap-3 py-3 px-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-chart-1/5 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-primary/20"
          style={{ paddingLeft: `${task.level * 1.5 + 1}rem` }}
        >
          <button onClick={() => toggleTask(task.id)} className="shrink-0" disabled={!hasChildren}>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="size-4 text-primary" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )
            ) : (
              <div className="size-4" />
            )}
          </button>

          {isEditing ? (
            <>
              <Input
                value={editValues.name}
                onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                className="flex-1 h-8"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                type="number"
                value={editValues.duration}
                onChange={(e) => setEditValues({ ...editValues, duration: Number.parseInt(e.target.value) || 0 })}
                className="w-20 h-8"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                type="number"
                value={editValues.cost}
                onChange={(e) => setEditValues({ ...editValues, cost: Number.parseInt(e.target.value) || 0 })}
                className="w-24 h-8"
                onClick={(e) => e.stopPropagation()}
              />
              <Button size="icon" variant="ghost" className="size-8 text-success" onClick={() => saveEdit(task.id)}>
                <Check className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={cancelEdit}>
                <X className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{task.name}</div>
                <div className="text-sm text-muted-foreground">{task.wbsCode}</div>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 bg-gradient-to-r from-chart-2/10 to-info/10 border-chart-2/30"
              >
                {task.duration}d
              </Badge>
              {task.resource && (
                <Badge variant="secondary" className="shrink-0 bg-gradient-to-r from-chart-4/20 to-success/20">
                  {task.resource}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="shrink-0 bg-gradient-to-r from-chart-3/10 to-warning/10 border-chart-3/30"
              >
                ${task.cost.toLocaleString()}
              </Badge>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTaskForPredecessors(task.id)
                  }}
                  title="Edit Predecessors"
                >
                  <Link2 className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 hover:bg-primary/10 hover:text-primary"
                  onClick={(e) => startEdit(task, e)}
                  title="Edit Task"
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => deleteTask(task.id, e)}
                  title="Delete Task"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
        {isExpanded && children.map((child) => renderTask(child))}
      </div>
    )
  }

  const rootTasks = project.tasks.filter((t) => t.level === 1)

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="size-2 rounded-full bg-gradient-to-r from-chart-1 to-chart-5 animate-pulse" />
                Work Breakdown Structure
              </CardTitle>
              <CardDescription className="text-base mt-1">
                AI-generated task hierarchy with inline editing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Regenerate button - commented out per user request */}
              {/* <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
                onClick={() => {
                  // Regenerate WBS using AI generator
                  // This would typically call an AI service
                  alert("WBS regeneration feature coming soon! For now, you can manually edit tasks.")
                }}
              >
                <Sparkles className="size-4 text-primary" />
                Regenerate
              </Button> */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 gradient-primary shadow-lg shadow-primary/30">
                    <Plus className="size-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Create a new task in your project</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-name">Task Name</Label>
                      <Input
                        id="task-name"
                        placeholder="Enter task name"
                        value={newTask.name}
                        onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-duration">Duration (days)</Label>
                      <Input
                        id="task-duration"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={newTask.duration}
                        onChange={(e) => setNewTask({ ...newTask, duration: Number.parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-parent">Parent Task (Optional)</Label>
                      <Select 
                        value={newTask.parentId || "none"} 
                        onValueChange={(value) => setNewTask({ ...newTask, parentId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent task (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Root Level)</SelectItem>
                          {project.tasks
                            .filter((t) => t.level <= 2)
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.wbsCode} - {task.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-resource">Resource (Optional)</Label>
                      <Select 
                        value={newTask.resource || "none"} 
                        onValueChange={(value) => setNewTask({ ...newTask, resource: value === "none" ? "" : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select resource (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {project.resources.map((resource) => (
                            <SelectItem key={resource.id} value={resource.role}>
                              {resource.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addTask} className="gradient-primary">
                      Add Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">{rootTasks.map((task) => renderTask(task))}</div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-l-4 border-l-primary shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-1/10 to-chart-1/5 border border-chart-1/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</div>
              <div className="text-3xl font-black bg-gradient-to-r from-chart-1 to-chart-5 bg-clip-text text-transparent">
                {project.tasks.length}
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
              <div className="text-3xl font-black bg-gradient-to-r from-chart-2 to-info bg-clip-text text-transparent">
                {project.duration} days
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-3/10 to-chart-3/5 border border-chart-3/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Budget</div>
              <div className="text-3xl font-black bg-gradient-to-r from-chart-3 to-warning bg-clip-text text-transparent">
                ${project.budget.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-chart-4/10 to-chart-4/5 border border-chart-4/20">
              <div className="text-sm font-medium text-muted-foreground mb-1">Resources</div>
              <div className="text-3xl font-black bg-gradient-to-r from-chart-4 to-success bg-clip-text text-transparent">
                {project.resources.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predecessor Editor Dialog */}
      {selectedTaskForPredecessors && (
        <Dialog open={!!selectedTaskForPredecessors} onOpenChange={(open) => !open && setSelectedTaskForPredecessors(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Predecessors & Dependencies</DialogTitle>
              <DialogDescription>
                Manage task dependencies and set dependency types (FS, SS, FF, SF)
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const task = project.tasks.find(t => t.id === selectedTaskForPredecessors)
              if (!task) return null
              return (
                <PredecessorEditor
                  project={project}
                  task={task}
                  onUpdate={(updatedProject) => {
                    updateProject(updatedProject)
                    onUpdate?.()
                  }}
                />
              )
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
