/**
 * Automation Engine
 * Rule-based workflows and notifications
 */

import type { Project, Task, AutomationRule, TaskActivity } from "./types"
import { updateProject, getProjectById } from "./storage"

export interface AutomationContext {
  project: Project
  task: Task
  userId?: string
  previousValue?: any
  newValue?: any
}

export class AutomationEngine {
  /**
   * Evaluate and execute automation rules
   */
  static async evaluateRules(
    projectId: string,
    trigger: string,
    context: AutomationContext
  ): Promise<void> {
    const project = getProjectById(projectId)
    if (!project || !project.automationRules) return

    const activeRules = project.automationRules.filter(rule => rule.enabled && rule.trigger === trigger)

    for (const rule of activeRules) {
      try {
        const conditionMet = this.evaluateCondition(rule.condition, context)
        if (conditionMet) {
          await this.executeAction(rule.action, projectId, context)
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)
      }
    }
  }

  /**
   * Evaluate a condition
   */
  static evaluateCondition(condition: string, context: AutomationContext): boolean {
    try {
      const conditionObj = JSON.parse(condition)
      return this.evaluateConditionObject(conditionObj, context)
    } catch {
      // Simple string conditions
      return this.evaluateSimpleCondition(condition, context)
    }
  }

  /**
   * Evaluate a condition object
   */
  static evaluateConditionObject(condition: any, context: AutomationContext): boolean {
    const { field, operator, value } = condition

    let fieldValue: any
    switch (field) {
      case "task.status":
        fieldValue = context.task.status
        break
      case "task.priority":
        fieldValue = context.task.priority
        break
      case "task.dueDate":
        fieldValue = context.task.dueDate
        break
      case "task.progress":
        fieldValue = context.task.progress
        break
      case "task.isCriticalPath":
        fieldValue = context.task.isCriticalPath
        break
      default:
        return false
    }

    switch (operator) {
      case "equals":
        return fieldValue === value
      case "notEquals":
        return fieldValue !== value
      case "greaterThan":
        return Number(fieldValue) > Number(value)
      case "lessThan":
        return Number(fieldValue) < Number(value)
      case "contains":
        return String(fieldValue).includes(String(value))
      case "isNull":
        return fieldValue === null || fieldValue === undefined
      case "isNotNull":
        return fieldValue !== null && fieldValue !== undefined
      default:
        return false
    }
  }

  /**
   * Evaluate simple string condition
   */
  static evaluateSimpleCondition(condition: string, context: AutomationContext): boolean {
    // Simple conditions like "status == 'completed'"
    if (condition.includes("status") && condition.includes("completed")) {
      return context.task.status === "completed"
    }
    if (condition.includes("priority") && condition.includes("urgent")) {
      return context.task.priority === "urgent"
    }
    if (condition.includes("dueDate") && condition.includes("overdue")) {
      if (!context.task.dueDate) return false
      return new Date(context.task.dueDate) < new Date()
    }
    return false
  }

  /**
   * Execute an action
   */
  static async executeAction(
    action: string,
    projectId: string,
    context: AutomationContext
  ): Promise<void> {
    try {
      const actionObj = JSON.parse(action)
      await this.executeActionObject(actionObj, projectId, context)
    } catch {
      // Simple string actions
      await this.executeSimpleAction(action, projectId, context)
    }
  }

  /**
   * Execute an action object
   */
  static async executeActionObject(
    action: any,
    projectId: string,
    context: AutomationContext
  ): Promise<void> {
    const { type, params } = action

    switch (type) {
      case "changeStatus":
        await this.changeTaskStatus(projectId, context.task.id, params.status)
        break
      case "changePriority":
        await this.changeTaskPriority(projectId, context.task.id, params.priority)
        break
      case "assignUser":
        await this.assignTask(projectId, context.task.id, params.userId)
        break
      case "sendNotification":
        await this.sendNotification(projectId, params.message, params.userId)
        break
      case "createTask":
        await this.createTask(projectId, params)
        break
      case "addComment":
        await this.addComment(projectId, context.task.id, params.comment, context.userId)
        break
      default:
        console.warn(`Unknown action type: ${type}`)
    }
  }

  /**
   * Execute simple string action
   */
  static async executeSimpleAction(
    action: string,
    projectId: string,
    context: AutomationContext
  ): Promise<void> {
    if (action.includes("changeStatus")) {
      const status = action.match(/to\s+(\w+)/)?.[1]
      if (status) {
        await this.changeTaskStatus(projectId, context.task.id, status as any)
      }
    } else if (action.includes("notify")) {
      await this.sendNotification(projectId, `Task "${context.task.name}" requires attention`, context.userId)
    }
  }

  /**
   * Change task status
   */
  static async changeTaskStatus(
    projectId: string,
    taskId: string,
    newStatus: Task["status"]
  ): Promise<void> {
    const project = getProjectById(projectId)
    if (!project) return

    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task
    )

    const activity: TaskActivity = {
      id: crypto.randomUUID(),
      taskId,
      projectId,
      userId: "system",
      userName: "Automation",
      action: "updated",
      details: `Status changed to ${newStatus} (automated)`,
      timestamp: new Date().toISOString(),
    }

    updateProject({
      ...project,
      tasks: updatedTasks,
      activityFeed: [...(project.activityFeed || []), activity],
    })
  }

  /**
   * Change task priority
   */
  static async changeTaskPriority(
    projectId: string,
    taskId: string,
    newPriority: Task["priority"]
  ): Promise<void> {
    const project = getProjectById(projectId)
    if (!project) return

    const updatedTasks = project.tasks.map(task =>
      task.id === taskId ? { ...task, priority: newPriority, updatedAt: new Date().toISOString() } : task
    )

    updateProject({
      ...project,
      tasks: updatedTasks,
    })
  }

  /**
   * Assign task to user
   */
  static async assignTask(
    projectId: string,
    taskId: string,
    userId: string
  ): Promise<void> {
    const project = getProjectById(projectId)
    if (!project) return

    const updatedTasks = project.tasks.map(task =>
      task.id === taskId
        ? {
          ...task,
          assignedTo: [...new Set([...(task.assignedTo || []), userId])],
          updatedAt: new Date().toISOString(),
        }
        : task
    )

    updateProject({
      ...project,
      tasks: updatedTasks,
    })
  }

  /**
   * Send notification (in real app, would integrate with notification service)
   */
  static async sendNotification(
    projectId: string,
    message: string,
    userId?: string
  ): Promise<void> {
    // In a real app, this would send email, push notification, etc.
    console.log(`Notification to ${userId || "all"}: ${message}`)

    // Add to activity feed
    const project = getProjectById(projectId)
    if (project) {
      const activity: TaskActivity = {
        id: crypto.randomUUID(),
        taskId: "",
        projectId,
        userId: "system",
        userName: "Automation",
        action: "notification",
        details: message,
        timestamp: new Date().toISOString(),
      }

      updateProject({
        ...project,
        activityFeed: [...(project.activityFeed || []), activity],
      })
    }
  }

  /**
   * Create a new task
   */
  static async createTask(projectId: string, params: any): Promise<void> {
    const project = getProjectById(projectId)
    if (!project) return

    // Implementation would create a new task
    // This is a placeholder
    console.log("Creating task:", params)
  }

  /**
   * Add comment to task
   */
  static async addComment(
    projectId: string,
    taskId: string,
    comment: string,
    userId: string = "system"
  ): Promise<void> {
    const project = getProjectById(projectId)
    if (!project) return

    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return

    const newComment = {
      id: crypto.randomUUID(),
      taskId,
      userId,
      userName: "Automation",
      content: comment,
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedTasks = project.tasks.map(t =>
      t.id === taskId ? { ...t, comments: [...(t.comments || []), newComment] } : t
    )

    updateProject({
      ...project,
      tasks: updatedTasks,
    })
  }

  /**
   * Common trigger handlers
   */
  static async onTaskCreated(projectId: string, task: Task): Promise<void> {
    await this.evaluateRules(projectId, "taskCreated", {
      project: getProjectById(projectId)!,
      task,
    })
  }

  static async onTaskStatusChanged(
    projectId: string,
    task: Task,
    previousStatus: Task["status"]
  ): Promise<void> {
    await this.evaluateRules(projectId, "statusChanged", {
      project: getProjectById(projectId)!,
      task,
      previousValue: previousStatus,
      newValue: task.status,
    })
  }

  static async onDeadlineApproaching(projectId: string, task: Task): Promise<void> {
    await this.evaluateRules(projectId, "deadlineApproaching", {
      project: getProjectById(projectId)!,
      task,
    })
  }

  static async onDependencyCompleted(projectId: string, task: Task): Promise<void> {
    await this.evaluateRules(projectId, "dependencyCompleted", {
      project: getProjectById(projectId)!,
      task,
    })
  }
}

