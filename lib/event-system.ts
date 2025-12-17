/**
 * Event System
 * Bi-directional sync between Planner and Network Diagram
 */

import type { Project, Task } from "./types"
import { NetworkDiagramService } from "./network-diagram-service"
import { AutomationEngine } from "./automation-engine"
import { updateProject, getProjectById } from "./storage"

export type EventType =
  | "taskCreated"
  | "taskUpdated"
  | "taskDeleted"
  | "dependencyAdded"
  | "dependencyRemoved"
  | "dateChanged"
  | "statusChanged"
  | "priorityChanged"

export interface ProjectEvent {
  type: EventType
  projectId: string
  taskId?: string
  data?: any
  timestamp: string
}

type EventHandler = (event: ProjectEvent) => void | Promise<void>

class EventSystem {
  private handlers: Map<EventType, Set<EventHandler>> = new Map()
  private projectSubscribers: Map<string, Set<EventHandler>> = new Map()

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler)
    }
  }

  /**
   * Subscribe to all events for a specific project
   */
  subscribeToProject(projectId: string, handler: EventHandler): () => void {
    if (!this.projectSubscribers.has(projectId)) {
      this.projectSubscribers.set(projectId, new Set())
    }
    this.projectSubscribers.get(projectId)!.add(handler)

    return () => {
      this.projectSubscribers.get(projectId)?.delete(handler)
    }
  }

  /**
   * Emit an event
   */
  async emit(event: ProjectEvent): Promise<void> {
    // Notify type-specific handlers
    const typeHandlers = this.handlers.get(event.type)
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          await handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error)
        }
      }
    }

    // Notify project-specific handlers
    const projectHandlers = this.projectSubscribers.get(event.projectId)
    if (projectHandlers) {
      for (const handler of projectHandlers) {
        try {
          await handler(event)
        } catch (error) {
          console.error(`Error in project event handler:`, error)
        }
      }
    }
  }
}

// Singleton instance
export const eventSystem = new EventSystem()

/**
 * Event Handlers
 */

// Auto-update network diagram when task changes
eventSystem.subscribe("taskCreated", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  // Recalculate critical path
  const updated = NetworkDiagramService.updateTaskDates(project)
  updateProject(updated)

  // Trigger automation
  const task = project.tasks.find(t => t.id === event.taskId)
  if (task) {
    await AutomationEngine.onTaskCreated(event.projectId, task)
  }
})

eventSystem.subscribe("taskUpdated", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  // Recalculate critical path if dates or dependencies changed
  const updated = NetworkDiagramService.updateTaskDates(project)
  updateProject(updated)
})

eventSystem.subscribe("dependencyAdded", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  // Recalculate critical path
  const updated = NetworkDiagramService.updateTaskDates(project)
  updateProject(updated)
})

eventSystem.subscribe("dependencyRemoved", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  // Recalculate critical path
  const updated = NetworkDiagramService.updateTaskDates(project)
  updateProject(updated)
})

eventSystem.subscribe("dateChanged", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  // Recalculate ES/EF/LS/LF for all dependent tasks
  const updated = NetworkDiagramService.updateTaskDates(project)
  updateProject(updated)
})

eventSystem.subscribe("statusChanged", async (event) => {
  const project = getProjectById(event.projectId)
  if (!project) return

  const task = project.tasks.find(t => t.id === event.taskId)
  if (!task) return

  // Trigger automation
  await AutomationEngine.onTaskStatusChanged(
    event.projectId,
    task,
    event.data?.previousStatus
  )

  // Check if dependencies are now complete
  if (task.status === "completed") {
    // Notify dependent tasks
    const dependentTasks = project.tasks.filter(t =>
      (t.dependencies || []).includes(task.id)
    )

    for (const dependentTask of dependentTasks) {
      const allPredecessorsComplete = (dependentTask.dependencies || []).every(depId => {
        const depTask = project.tasks.find(t => t.id === depId)
        return depTask?.status === "completed"
      })

      if (allPredecessorsComplete) {
        await AutomationEngine.onDependencyCompleted(event.projectId, dependentTask)
      }
    }
  }
})

/**
 * Helper functions to emit events
 */
export function emitTaskCreated(projectId: string, taskId: string): void {
  eventSystem.emit({
    type: "taskCreated",
    projectId,
    taskId,
    timestamp: new Date().toISOString(),
  })
}

export function emitTaskUpdated(projectId: string, taskId: string, data?: any): void {
  eventSystem.emit({
    type: "taskUpdated",
    projectId,
    taskId,
    data,
    timestamp: new Date().toISOString(),
  })
}

export function emitDependencyAdded(projectId: string, fromTaskId: string, toTaskId: string): void {
  eventSystem.emit({
    type: "dependencyAdded",
    projectId,
    taskId: toTaskId,
    data: { fromTaskId, toTaskId },
    timestamp: new Date().toISOString(),
  })
}

export function emitDependencyRemoved(projectId: string, fromTaskId: string, toTaskId: string): void {
  eventSystem.emit({
    type: "dependencyRemoved",
    projectId,
    taskId: toTaskId,
    data: { fromTaskId, toTaskId },
    timestamp: new Date().toISOString(),
  })
}

export function emitDateChanged(projectId: string, taskId: string, previousDate?: string): void {
  eventSystem.emit({
    type: "dateChanged",
    projectId,
    taskId,
    data: { previousDate },
    timestamp: new Date().toISOString(),
  })
}

export function emitStatusChanged(
  projectId: string,
  taskId: string,
  previousStatus: Task["status"]
): void {
  eventSystem.emit({
    type: "statusChanged",
    projectId,
    taskId,
    data: { previousStatus },
    timestamp: new Date().toISOString(),
  })
}

