"use client"

import { useState, useEffect } from "react"
import { Home, CheckSquare, Network, Users, Calendar, Clock, Save, Undo, Redo, ZoomIn, ZoomOut, BarChart3 } from "lucide-react"
import type { Project, Task, Dependency } from "@/lib/types"
import { updateProject, getProjectById } from "@/lib/storage"
import { initializeTask } from "@/lib/task-utils"
import { NetworkDiagramService } from "@/lib/network-diagram-service"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MSProjectRibbonProps {
  activeView: "gantt" | "task-sheet" | "network" | "resource-sheet" | "resource-usage" | "calendar" | "timeline"
  onViewChange: (view: typeof activeView) => void
  project: Project
  onProjectChange: (project: Project) => void
  projects: Project[]
  selectedTaskId: string | null
  onTaskSelect: (taskId: string | null) => void
  showStatistics: boolean
  onToggleStatistics: () => void
  zoomLevel: number
  onZoomChange: (level: number) => void
  showCriticalPath: boolean
  onCriticalPathToggle: (show: boolean) => void
  showBaseline: boolean
  onBaselineToggle: (show: boolean) => void
  showSlack: boolean
  onSlackToggle: (show: boolean) => void
  showOverallocation: boolean
  onOverallocationToggle: (show: boolean) => void
}

export function MSProjectRibbon({
  activeView,
  onViewChange,
  project,
  onProjectChange,
  projects,
  selectedTaskId,
  onTaskSelect,
  showStatistics,
  onToggleStatistics,
  zoomLevel,
  onZoomChange,
  showCriticalPath,
  onCriticalPathToggle,
  showBaseline,
  onBaselineToggle,
  showSlack,
  onSlackToggle,
  showOverallocation,
  onOverallocationToggle
}: MSProjectRibbonProps) {
  const { toast } = useToast()
  const [history, setHistory] = useState<Project[]>([project])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Update history when project changes externally
  useEffect(() => {
    if (project && (history.length === 0 || history[history.length - 1].id !== project.id || history[history.length - 1].updatedAt !== project.updatedAt)) {
      setHistory([project])
      setHistoryIndex(0)
    }
  }, [project.id, project.updatedAt])
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [isLinkTasksDialogOpen, setIsLinkTasksDialogOpen] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState(1)
  const [linkFromTaskId, setLinkFromTaskId] = useState("")
  const [linkToTaskId, setLinkToTaskId] = useState("")
  const [isNewResourceDialogOpen, setIsNewResourceDialogOpen] = useState(false)
  const [isAssignResourceDialogOpen, setIsAssignResourceDialogOpen] = useState(false)
  const [newResourceName, setNewResourceName] = useState("")
  const [newResourceRate, setNewResourceRate] = useState(50)
  const [assignTaskId, setAssignTaskId] = useState("")
  const [assignResourceId, setAssignResourceId] = useState("")

  // Add to history
  const addToHistory = (newProject: Project) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newProject))) // Deep clone
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    // Limit history to 50 items
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50))
      setHistoryIndex(49)
    }
  }

  // Save project
  const handleSave = () => {
    updateProject(project)
    toast({
      title: "Project Saved",
      description: "Project changes have been saved successfully.",
    })
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const projectToRestore = JSON.parse(JSON.stringify(history[newIndex])) // Deep clone
      onProjectChange(projectToRestore)
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const projectToRestore = JSON.parse(JSON.stringify(history[newIndex])) // Deep clone
      onProjectChange(projectToRestore)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) {
          handleUndo()
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === "z") || e.key === "y")) {
        e.preventDefault()
        if (historyIndex < history.length - 1) {
          handleRedo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [history, historyIndex, project])

  // Zoom
  const handleZoomIn = () => {
    onZoomChange(Math.min(3, zoomLevel + 0.2))
  }

  const handleZoomOut = () => {
    onZoomChange(Math.max(0.5, zoomLevel - 0.2))
  }

  // New Task
  const handleNewTask = () => {
    setIsNewTaskDialogOpen(true)
  }

  const generateWBSCode = (parentId: string | null = null): string => {
    if (!parentId) {
      // Root level task - find highest root level number
      const rootTasks = project.tasks.filter((t) => t.level === 1)
      const maxRootNum = rootTasks.reduce((max, t) => {
        const num = parseInt(t.wbsCode.split('.')[0]) || 0
        return Math.max(max, num)
      }, 0)
      return `${maxRootNum + 1}`
    }

    const parent = project.tasks.find((t) => t.id === parentId)
    if (!parent) return "1.1"

    const siblings = project.tasks.filter((t) => t.parentId === parentId)
    const parentParts = parent.wbsCode.split(".")
    return `${parentParts.join(".")}.${siblings.length + 1}`
  }

  // Regenerate all WBS codes based on hierarchy
  const regenerateWBSCodes = (tasks: Task[]): Task[] => {
    // Sort tasks by level and order
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      // Same level - maintain order
      return 0
    })

    const updatedTasks: Task[] = []
    const levelCounters = new Map<number, Map<string | null, number>>() // level -> parentId -> counter

    sortedTasks.forEach(task => {
      const parentId = task.parentId
      const level = task.level

      if (!levelCounters.has(level)) {
        levelCounters.set(level, new Map())
      }
      const levelMap = levelCounters.get(level)!

      if (!levelMap.has(parentId)) {
        levelMap.set(parentId, 0)
      }
      levelMap.set(parentId, levelMap.get(parentId)! + 1)
      const counter = levelMap.get(parentId)!

      let wbsCode: string
      if (parentId) {
        const parent = updatedTasks.find(t => t.id === parentId)
        if (parent) {
          wbsCode = `${parent.wbsCode}.${counter}`
        } else {
          wbsCode = `${level}.${counter}`
        }
      } else {
        wbsCode = `${counter}`
      }

      updatedTasks.push({ ...task, wbsCode })
    })

    return updatedTasks
  }

  const handleCreateTask = () => {
    if (!newTaskName.trim()) {
      toast({
        title: "Error",
        description: "Task name is required",
        variant: "destructive",
      })
      return
    }

    const startDate = new Date(project.startDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + newTaskDuration)

    const wbsCode = generateWBSCode(null)
    const newTask = initializeTask({
      name: newTaskName,
      duration: newTaskDuration,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      wbsCode,
      level: 1,
    }, { ownerId: project.ownerId })

    const updatedProject = {
      ...project,
      tasks: [...project.tasks, newTask],
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      addToHistory(finalProject)
      onProjectChange(finalProject)
      updateProject(finalProject)

      toast({
        title: "Task Created",
        description: `Task "${newTaskName}" has been created.`,
      })

      // Select the new task
      onTaskSelect(newTask.id)
    } else {
      toast({
        title: "Error",
        description: networkResult.errors.join(", "),
        variant: "destructive",
      })
    }

    setIsNewTaskDialogOpen(false)
    setNewTaskName("")
    setNewTaskDuration(1)
  }

  // Link Tasks
  const handleLinkTasks = () => {
    setIsLinkTasksDialogOpen(true)
  }

  const handleCreateLink = () => {
    if (!linkFromTaskId || !linkToTaskId) {
      toast({
        title: "Error",
        description: "Please select both tasks",
        variant: "destructive",
      })
      return
    }

    if (linkFromTaskId === linkToTaskId) {
      toast({
        title: "Error",
        description: "A task cannot depend on itself",
        variant: "destructive",
      })
      return
    }

    const newDependency: Dependency = {
      id: `dep-${linkFromTaskId}-${linkToTaskId}-${Date.now()}`,
      fromTaskId: linkFromTaskId,
      toTaskId: linkToTaskId,
      type: "finishToStart",
      lagDays: 0,
    }

    // Update both predecessors and successors arrays
    const updatedTasks = project.tasks.map(t => {
      if (t.id === linkToTaskId) {
        const newDeps = [...(t.dependencies || []), linkFromTaskId]
        const newPredecessors = [...(t.predecessors || []), linkFromTaskId]
        return { ...t, dependencies: newDeps, predecessors: newPredecessors }
      }
      if (t.id === linkFromTaskId) {
        const newSuccessors = [...(t.successors || []), linkToTaskId]
        return { ...t, successors: newSuccessors }
      }
      return t
    })

    const updatedProject = {
      ...project,
      dependencies: [...(project.dependencies || []), newDependency],
      tasks: updatedTasks,
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      addToHistory(finalProject)
      onProjectChange(finalProject)
      updateProject(finalProject)

      toast({
        title: "Tasks Linked",
        description: "Dependency created successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: networkResult.errors.join(", "),
        variant: "destructive",
      })
    }

    setIsLinkTasksDialogOpen(false)
    setLinkFromTaskId("")
    setLinkToTaskId("")
  }

  // Unlink Tasks
  const handleUnlinkTasks = () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      })
      return
    }

    const task = project.tasks.find(t => t.id === selectedTaskId)
    if (!task) {
      toast({
        title: "Error",
        description: "Selected task not found",
        variant: "destructive",
      })
      return
    }

    if (!task.dependencies || task.dependencies.length === 0) {
      toast({
        title: "Error",
        description: "Selected task has no dependencies",
        variant: "destructive",
      })
      return
    }

    // Remove from all related tasks
    const predecessorIds = task.predecessors || []
    const updatedTasks = project.tasks.map(t => {
      if (t.id === selectedTaskId) {
        return { ...t, dependencies: [], predecessors: [] }
      }
      // Remove this task from successors of predecessor tasks
      if (predecessorIds.includes(t.id)) {
        return { ...t, successors: (t.successors || []).filter(id => id !== selectedTaskId) }
      }
      return t
    })

    const updatedProject = {
      ...project,
      dependencies: project.dependencies?.filter(d => d.toTaskId !== selectedTaskId) || [],
      tasks: updatedTasks,
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      addToHistory(finalProject)
      onProjectChange(finalProject)
      updateProject(finalProject)

      toast({
        title: "Tasks Unlinked",
        description: "Dependencies removed successfully.",
      })
    }
  }

  // Delete Task
  const handleDeleteTask = () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      })
      return
    }

    // Remove task and clean up all references
    const updatedTasks = project.tasks
      .filter(t => t.id !== selectedTaskId)
      .map(t => {
        // Remove deleted task from predecessors and successors
        const newPredecessors = (t.predecessors || []).filter(id => id !== selectedTaskId)
        const newSuccessors = (t.successors || []).filter(id => id !== selectedTaskId)
        const newDependencies = (t.dependencies || []).filter(id => id !== selectedTaskId)
        return {
          ...t,
          predecessors: newPredecessors,
          successors: newSuccessors,
          dependencies: newDependencies,
        }
      })

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      dependencies: project.dependencies?.filter(d => d.fromTaskId !== selectedTaskId && d.toTaskId !== selectedTaskId) || [],
    }

    // Recalculate critical path
    const networkResult = NetworkDiagramService.calculateCriticalPath(updatedProject)
    if (networkResult.isValid) {
      const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
      addToHistory(finalProject)
      onProjectChange(finalProject)
      updateProject(finalProject)
      onTaskSelect(null)

      toast({
        title: "Task Deleted",
        description: "Task has been removed from the project.",
      })
    }
  }

  // Indent Task (Make it a subtask)
  const handleIndentTask = () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      })
      return
    }

    const task = project.tasks.find(t => t.id === selectedTaskId)
    if (!task) return

    // Find the previous task at the same or higher level
    const taskIndex = project.tasks.findIndex(t => t.id === selectedTaskId)
    let newParentId: string | null = null

    // Look backwards for a task at a lower level
    for (let i = taskIndex - 1; i >= 0; i--) {
      const prevTask = project.tasks[i]
      if (prevTask.level < task.level) {
        newParentId = prevTask.id
        break
      }
    }

    if (newParentId === null && task.level > 1) {
      toast({
        title: "Error",
        description: "Cannot indent: No valid parent task found",
        variant: "destructive",
      })
      return
    }

    const updatedTasks = project.tasks.map(t =>
      t.id === selectedTaskId
        ? {
          ...t,
          level: newParentId ? t.level + 1 : t.level,
          parentId: newParentId,
          isSummary: false,
        }
        : t
    )

    // Regenerate WBS codes for all tasks
    const tasksWithUpdatedWBS = regenerateWBSCodes(updatedTasks)
    const updatedProject = { ...project, tasks: tasksWithUpdatedWBS }
    const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
    addToHistory(finalProject)
    onProjectChange(finalProject)
    updateProject(finalProject)

    toast({
      title: "Task Indented",
      description: "Task has been moved to a lower level in the WBS.",
    })
  }

  // Outdent Task (Move it up a level)
  const handleOutdentTask = () => {
    if (!selectedTaskId) {
      toast({
        title: "Error",
        description: "Please select a task first",
        variant: "destructive",
      })
      return
    }

    const task = project.tasks.find(t => t.id === selectedTaskId)
    if (!task || !task.parentId) {
      toast({
        title: "Error",
        description: "Task is already at the top level",
        variant: "destructive",
      })
      return
    }

    const parent = project.tasks.find(t => t.id === task.parentId)
    const newParentId = parent?.parentId || null

    const updatedTasks = project.tasks.map(t =>
      t.id === selectedTaskId
        ? {
          ...t,
          level: Math.max(1, t.level - 1),
          parentId: newParentId,
        }
        : t
    )

    // Regenerate WBS codes for all tasks
    const tasksWithUpdatedWBS = regenerateWBSCodes(updatedTasks)
    const updatedProject = { ...project, tasks: tasksWithUpdatedWBS }
    const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
    addToHistory(finalProject)
    onProjectChange(finalProject)
    updateProject(finalProject)

    toast({
      title: "Task Outdented",
      description: "Task has been moved to a higher level in the WBS.",
    })
  }

  // New Resource
  const handleNewResource = () => {
    setIsNewResourceDialogOpen(true)
  }

  const handleCreateResource = () => {
    if (!newResourceName.trim()) {
      toast({
        title: "Error",
        description: "Resource name is required",
        variant: "destructive",
      })
      return
    }

    const newResource = {
      id: crypto.randomUUID(),
      name: newResourceName,
      role: "Team Member",
      rate: newResourceRate,
    }

    const updatedProject = {
      ...project,
      resources: [...project.resources, newResource],
    }

    addToHistory(updatedProject)
    onProjectChange(updatedProject)
    updateProject(updatedProject)

    toast({
      title: "Resource Created",
      description: `Resource "${newResourceName}" has been added.`,
    })

    setIsNewResourceDialogOpen(false)
    setNewResourceName("")
    setNewResourceRate(50)
  }

  // Assign Resources
  const handleAssignResources = () => {
    setIsAssignResourceDialogOpen(true)
  }

  const handleAssignResource = () => {
    if (!assignTaskId || !assignResourceId) {
      toast({
        title: "Error",
        description: "Please select both a task and a resource",
        variant: "destructive",
      })
      return
    }

    const resource = project.resources.find(r => r.id === assignResourceId)
    if (!resource) return

    const updatedTasks = project.tasks.map(t =>
      t.id === assignTaskId
        ? { ...t, resource: resource.role }
        : t
    )

    const updatedProject = { ...project, tasks: updatedTasks }
    const finalProject = NetworkDiagramService.updateTaskDates(updatedProject)
    addToHistory(finalProject)
    onProjectChange(finalProject)
    updateProject(finalProject)

    toast({
      title: "Resource Assigned",
      description: `Resource "${resource.name}" has been assigned to the task.`,
    })

    setIsAssignResourceDialogOpen(false)
    setAssignTaskId("")
    setAssignResourceId("")
  }

  // Resource Leveling
  const handleResourceLeveling = () => {
    // Simple resource leveling: detect overallocation and suggest fixes
    const resourceUsage = new Map<string, number[]>() // resource -> array of daily hours

    project.tasks.forEach(task => {
      if (!task.resource) return

      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)

      for (let d = 0; d < project.duration; d++) {
        const date = new Date(project.startDate)
        date.setDate(date.getDate() + d)

        if (date >= taskStart && date <= taskEnd) {
          if (!resourceUsage.has(task.resource)) {
            resourceUsage.set(task.resource, new Array(project.duration).fill(0))
          }
          const dailyHours = resourceUsage.get(task.resource)!
          dailyHours[d] = (dailyHours[d] || 0) + 8 // 8 hours per day
        }
      }
    })

    // Find overallocations
    const overallocations: string[] = []
    resourceUsage.forEach((hours, resource) => {
      const maxHours = Math.max(...hours)
      if (maxHours > 8) {
        overallocations.push(resource)
      }
    })

    if (overallocations.length === 0) {
      toast({
        title: "Resource Leveling",
        description: "No resource overallocations detected. All resources are properly leveled.",
      })
    } else {
      toast({
        title: "Resource Overallocation Detected",
        description: `The following resources are overallocated: ${overallocations.join(", ")}`,
        variant: "destructive",
      })
    }
  }

  // Overallocation Detection
  const handleShowOverallocation = () => {
    onOverallocationToggle(!showOverallocation)
    toast({
      title: showOverallocation ? "Overallocation Hidden" : "Overallocation Shown",
      description: showOverallocation
        ? "Overallocation highlighting has been hidden."
        : "Overallocated resources are now highlighted in red.",
    })
  }

  // Level Resources
  const handleLevelResources = () => {
    handleResourceLeveling()
  }

  return (
    <>
      <div className="bg-white border-b border-gray-300 shadow-sm">
        {/* Quick Access Toolbar */}
        <div className="h-10 bg-[#f3f3f3] border-b border-gray-300 flex items-center px-4 gap-2">
          <button
            onClick={handleSave}
            className="p-1.5 hover:bg-gray-200 rounded"
            title="Save (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-gray-200 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-gray-200 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={onToggleStatistics}
            className={`p-1.5 rounded ${showStatistics ? "bg-blue-100 hover:bg-blue-200" : "hover:bg-gray-200"}`}
            title="Toggle Statistics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>

        {/* Ribbon Tabs */}
        <div className="flex border-b border-gray-300">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "gantt"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("gantt")}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Gantt Chart</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "task-sheet"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("task-sheet")}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>Task Sheet</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "network"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("network")}
          >
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span>Network Diagram</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "resource-sheet"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("resource-sheet")}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Resource Sheet</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "resource-usage"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("resource-usage")}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Resource Usage</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "calendar"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("calendar")}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeView === "timeline"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            onClick={() => onViewChange("timeline")}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </div>
          </button>
        </div>

        {/* Ribbon Content */}
        <div className="h-32 bg-white px-4 py-3">
          {activeView === "gantt" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Task</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleNewTask}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    New Task
                  </button>
                  <button
                    onClick={handleLinkTasks}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Link Tasks
                  </button>
                  <button
                    onClick={handleUnlinkTasks}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Unlink Tasks
                  </button>
                </div>
              </div>
              <div className="w-px h-16 bg-gray-300" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Schedule</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onCriticalPathToggle(!showCriticalPath)}
                    className={`px-3 py-1.5 text-sm border rounded hover:bg-gray-50 ${showCriticalPath ? "bg-blue-100 border-blue-300" : "border-gray-300"
                      }`}
                  >
                    Critical Path
                  </button>
                  <button
                    onClick={() => onBaselineToggle(!showBaseline)}
                    className={`px-3 py-1.5 text-sm border rounded hover:bg-gray-50 ${showBaseline ? "bg-blue-100 border-blue-300" : "border-gray-300"
                      }`}
                  >
                    Baseline
                  </button>
                  <button
                    onClick={() => onSlackToggle(!showSlack)}
                    className={`px-3 py-1.5 text-sm border rounded hover:bg-gray-50 ${showSlack ? "bg-blue-100 border-blue-300" : "border-gray-300"
                      }`}
                  >
                    Slack
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "task-sheet" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Task</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleNewTask}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Insert Task
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    disabled={!selectedTaskId}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Task
                  </button>
                  <button
                    onClick={handleIndentTask}
                    disabled={!selectedTaskId}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Indent Task
                  </button>
                  <button
                    onClick={handleOutdentTask}
                    disabled={!selectedTaskId}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Outdent Task
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "network" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Format</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      toast({
                        title: "Box Styles",
                        description: "Network diagram boxes are styled in MS Project format. Critical tasks are red, normal tasks are white/gray.",
                      })
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Box Styles
                  </button>
                  <button
                    onClick={() => {
                      toast({
                        title: "Layout",
                        description: "Network diagram uses hierarchical layout based on early start times and topological levels.",
                      })
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Layout
                  </button>
                  <button
                    onClick={() => onCriticalPathToggle(!showCriticalPath)}
                    className={`px-3 py-1.5 text-sm border rounded hover:bg-gray-50 ${showCriticalPath ? "bg-blue-100 border-blue-300" : "border-gray-300"
                      }`}
                  >
                    Critical Path
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "resource-sheet" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Resource</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleNewResource}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    New Resource
                  </button>
                  <button
                    onClick={handleAssignResources}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Assign Resources
                  </button>
                  <button
                    onClick={handleResourceLeveling}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Resource Leveling
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "resource-usage" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Resource</span>
                <div className="flex gap-1">
                  <button
                    onClick={handleShowOverallocation}
                    className={`px-3 py-1.5 text-sm border rounded hover:bg-gray-50 ${showOverallocation ? "bg-red-100 border-red-300" : "border-gray-300"
                      }`}
                  >
                    Overallocation
                  </button>
                  <button
                    onClick={handleLevelResources}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Level Resources
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "calendar" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">View</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      // View mode is handled in CalendarView component
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Month
                  </button>
                  <button
                    onClick={() => {
                      // View mode is handled in CalendarView component
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      // View mode is handled in CalendarView component
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Day
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeView === "timeline" && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-600">Timeline</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (selectedTaskId) {
                        toast({
                          title: "Task Added to Timeline",
                          description: "Selected task is now visible in the timeline view.",
                        })
                      } else {
                        toast({
                          title: "Info",
                          description: "All tasks are displayed in the timeline. Select a task to highlight it.",
                        })
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Add to Timeline
                  </button>
                  <button
                    onClick={() => {
                      toast({
                        title: "Timeline Format",
                        description: "Timeline formatting options are available in the view.",
                      })
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Format Timeline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a new task in the project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Enter task name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTask()
                }}
              />
            </div>
            <div>
              <Label htmlFor="task-duration">Duration (days)</Label>
              <Input
                id="task-duration"
                type="number"
                min="1"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Tasks Dialog */}
      <Dialog open={isLinkTasksDialogOpen} onOpenChange={setIsLinkTasksDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Tasks</DialogTitle>
            <DialogDescription>Create a dependency between two tasks</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="from-task">From Task (Predecessor)</Label>
              <select
                id="from-task"
                value={linkFromTaskId}
                onChange={(e) => setLinkFromTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a task</option>
                {project.tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.wbsCode}: {task.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="to-task">To Task (Successor)</Label>
              <select
                id="to-task"
                value={linkToTaskId}
                onChange={(e) => setLinkToTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a task</option>
                {project.tasks
                  .filter(t => t.id !== linkFromTaskId)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.wbsCode}: {task.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkTasksDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLink}>Create Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Resource Dialog */}
      <Dialog open={isNewResourceDialogOpen} onOpenChange={setIsNewResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Resource</DialogTitle>
            <DialogDescription>Add a new resource to the project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="resource-name">Resource Name</Label>
              <Input
                id="resource-name"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
                placeholder="Enter resource name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateResource()
                }}
              />
            </div>
            <div>
              <Label htmlFor="resource-rate">Rate ($/hour)</Label>
              <Input
                id="resource-rate"
                type="number"
                min="0"
                value={newResourceRate}
                onChange={(e) => setNewResourceRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewResourceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateResource}>Create Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Resource Dialog */}
      <Dialog open={isAssignResourceDialogOpen} onOpenChange={setIsAssignResourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Resource</DialogTitle>
            <DialogDescription>Assign a resource to a task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="assign-task">Task</Label>
              <select
                id="assign-task"
                value={assignTaskId}
                onChange={(e) => setAssignTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a task</option>
                {project.tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.wbsCode}: {task.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="assign-resource">Resource</Label>
              <select
                id="assign-resource"
                value={assignResourceId}
                onChange={(e) => setAssignResourceId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select a resource</option>
                {project.resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} (${resource.rate}/hr)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignResourceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignResource}>Assign Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

