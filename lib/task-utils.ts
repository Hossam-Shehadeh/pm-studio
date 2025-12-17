/**
 * Task Utilities
 * Helper functions for task initialization and migration
 */

import type { Task } from "./types"

/**
 * Initialize a task with all required Planner and Network Diagram fields
 */
export function initializeTask(task: Partial<Task>, defaults: {
  ownerId?: string
  createdAt?: string
} = {}): Task {
  const now = new Date().toISOString()

  return {
    id: task.id || crypto.randomUUID(),
    name: task.name || "Untitled Task",
    wbsCode: task.wbsCode || "1",
    level: task.level ?? 1,
    parentId: task.parentId ?? null,
    duration: task.duration ?? 1,
    startDate: task.startDate || now,
    endDate: task.endDate || now,
    resource: task.resource ?? null,
    cost: task.cost ?? 0,
    isCriticalPath: task.isCriticalPath ?? false,
    dependencies: task.dependencies || [],

    // Planner fields
    status: task.status || "notStarted",
    priority: task.priority || "medium",
    assignedTo: task.assignedTo || (task.resource ? [task.resource] : []),
    dueDate: task.dueDate || task.endDate || null,
    description: task.description || "",
    checklist: task.checklist || [],
    labels: task.labels || [],
    progress: task.progress ?? 0,

    // Network Diagram fields
    earlyStart: task.earlyStart ?? null,
    earlyFinish: task.earlyFinish ?? null,
    lateStart: task.lateStart ?? null,
    lateFinish: task.lateFinish ?? null,
    floatDays: task.floatDays ?? null,
    freeFloatDays: task.freeFloatDays ?? null,
    predecessors: task.predecessors || task.dependencies || [],
    successors: task.successors || [],

    // MS Project fields
    constraintType: task.constraintType || "asSoonAsPossible",
    constraintDate: task.constraintDate,
    isMilestone: task.isMilestone ?? (task.duration === 0),
    isSummary: task.isSummary ?? false,
    work: task.work ?? (task.duration * 8),
    percentComplete: task.percentComplete ?? 0,
    actualStart: task.actualStart ?? null,
    actualFinish: task.actualFinish ?? null,
    baselineStart: task.baselineStart ?? null,
    baselineFinish: task.baselineFinish ?? null,
    baselineDuration: task.baselineDuration ?? null,

    // Collaboration
    comments: task.comments || [],
    attachments: task.attachments || [],

    // Metadata
    createdBy: task.createdBy || defaults.ownerId || "system",
    createdAt: task.createdAt || defaults.createdAt || now,
    updatedAt: task.updatedAt || now,
  }
}

/**
 * Migrate old task format to new format (backward compatibility)
 */
export function migrateTask(task: any): Task {
  // If task already has all new fields, return as-is
  if (task.status && task.priority && task.assignedTo !== undefined) {
    return task as Task
  }

  // Otherwise, initialize with defaults
  return initializeTask(task)
}

/**
 * Migrate project tasks to new format
 */
export function migrateProjectTasks(tasks: any[]): Task[] {
  return tasks.map(migrateTask)
}

