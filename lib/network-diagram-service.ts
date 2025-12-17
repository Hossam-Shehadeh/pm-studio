/**
 * Network Diagram Service
 * Implements Precedence Diagramming Method (PDM) for critical path calculations
 * Calculates: Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF), Float/Slack
 */

import type { Task, Dependency, Project } from "./types"

export interface TaskScheduleData {
  taskId: string
  earlyStart: number // Days from project start
  earlyFinish: number
  lateStart: number
  lateFinish: number
  totalFloat: number // Total float/slack
  freeFloat: number // Free float
  isCritical: boolean
}

export interface NetworkDiagramResult {
  scheduleData: Map<string, TaskScheduleData>
  criticalPath: string[]
  projectDuration: number
  isValid: boolean
  errors: string[]
}

export class NetworkDiagramService {
  /**
   * Calculate critical path using Precedence Diagramming Method (PDM)
   */
  static calculateCriticalPath(project: Project): NetworkDiagramResult {
    const errors: string[] = []
    const scheduleData = new Map<string, TaskScheduleData>()
    const taskMap = new Map<string, Task>()

    // Build task map
    project.tasks.forEach(task => {
      taskMap.set(task.id, task)
    })

    // Validate dependencies
    const validationResult = this.validateDependencies(project)
    if (!validationResult.isValid) {
      errors.push(...validationResult.errors)
      return {
        scheduleData,
        criticalPath: [],
        projectDuration: 0,
        isValid: false,
        errors
      }
    }

    // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
    const earlyStart = new Map<string, number>()
    const earlyFinish = new Map<string, number>()

    // Find tasks with no predecessors (start tasks)
    const startTasks = project.tasks.filter(task => {
      const deps = this.getPredecessors(task.id, project)
      return deps.length === 0
    })

    if (startTasks.length === 0) {
      errors.push("No start tasks found. Project must have at least one task with no dependencies.")
      return {
        scheduleData,
        criticalPath: [],
        projectDuration: 0,
        isValid: false,
        errors
      }
    }

    // Initialize start tasks
    startTasks.forEach(task => {
      earlyStart.set(task.id, 0)
      earlyFinish.set(task.id, task.duration)
    })

    // Topological sort for forward pass
    const processed = new Set<string>()
    const queue: string[] = [...startTasks.map(t => t.id)]

    while (queue.length > 0) {
      const taskId = queue.shift()!
      if (processed.has(taskId)) continue

      const task = taskMap.get(taskId)!
      const predecessors = this.getPredecessors(taskId, project)

      // Check if all predecessors are processed
      const allPredecessorsProcessed = predecessors.every(predId => processed.has(predId))
      if (!allPredecessorsProcessed && predecessors.length > 0) {
        queue.push(taskId) // Re-queue to process later
        continue
      }

      // Calculate ES and EF based on dependency type
      let es = 0
      if (predecessors.length > 0) {
        // Calculate ES based on all dependency types
        const esValues = predecessors.map(predId => {
          const dependency = this.getDependency(predId, taskId, project)
          const depType = dependency?.type || "finishToStart"
          const lag = dependency?.lagDays || 0
          const predTask = taskMap.get(predId)!
          const predES = earlyStart.get(predId) || 0
          const predEF = earlyFinish.get(predId) || 0

          switch (depType) {
            case "finishToStart":
              // FS: Successor starts after predecessor finishes + lag
              return predEF + lag
            case "startToStart":
              // SS: Successor starts when predecessor starts + lag
              return predES + lag
            case "finishToFinish":
              // FF: Successor finishes when predecessor finishes + lag
              // ES = EF - duration (to ensure successor finishes at the right time)
              const requiredEF = predEF + lag
              return Math.max(0, requiredEF - task.duration)
            case "startToFinish":
              // SF: Successor finishes when predecessor starts + lag
              // ES = predecessor ES + lag - duration
              return Math.max(0, (predES + lag) - task.duration)
            default:
              return predEF + lag
          }
        })
        es = Math.max(...esValues, 0) // Ensure ES >= 0
      }

      // Apply task constraints
      if (task.constraintType && task.constraintDate) {
        const projectStartDate = new Date(project.startDate)
        const constraintDate = new Date(task.constraintDate)
        const constraintDays = Math.ceil((constraintDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (task.constraintType) {
          case "mustStartOn":
          case "startNoEarlierThan":
            es = Math.max(es, constraintDays)
            break
          case "startNoLaterThan":
            es = Math.min(es, constraintDays)
            break
          case "mustFinishOn":
          case "finishNoEarlierThan":
            es = Math.max(es, constraintDays - task.duration)
            break
          case "finishNoLaterThan":
            es = Math.min(es, constraintDays - task.duration)
            break
        }
      }

      earlyStart.set(taskId, es)
      earlyFinish.set(taskId, es + task.duration)
      processed.add(taskId)

      // Add successors to queue
      const successors = this.getSuccessors(taskId, project)
      successors.forEach(succId => {
        if (!processed.has(succId) && !queue.includes(succId)) {
          queue.push(succId)
        }
      })
    }

    // Calculate project duration
    const projectDuration = Math.max(...Array.from(earlyFinish.values()))

    // Backward Pass: Calculate Late Start (LS) and Late Finish (LF)
    const lateFinish = new Map<string, number>()
    const lateStart = new Map<string, number>()

    // Find tasks with no successors (end tasks)
    const endTasks = project.tasks.filter(task => {
      const successors = this.getSuccessors(task.id, project)
      return successors.length === 0
    })

    // Initialize end tasks
    endTasks.forEach(task => {
      lateFinish.set(task.id, projectDuration)
      lateStart.set(task.id, projectDuration - task.duration)
    })

    // Reverse topological sort for backward pass
    const reverseProcessed = new Set<string>()
    const reverseQueue: string[] = [...endTasks.map(t => t.id)]

    while (reverseQueue.length > 0) {
      const taskId = reverseQueue.shift()!
      if (reverseProcessed.has(taskId)) continue

      const task = taskMap.get(taskId)!
      const successors = this.getSuccessors(taskId, project)

      // Check if all successors are processed
      const allSuccessorsProcessed = successors.every(succId => reverseProcessed.has(succId))
      if (!allSuccessorsProcessed && successors.length > 0) {
        reverseQueue.push(taskId)
        continue
      }

      // Calculate LF and LS based on dependency type (MS Project algorithm)
      let lf = projectDuration
      if (successors.length > 0) {
        // Calculate LF based on all dependency types
        const lfValues = successors.map(succId => {
          const dependency = this.getDependency(taskId, succId, project)
          const depType = dependency?.type || "finishToStart"
          const lag = dependency?.lagDays || 0
          const succTask = taskMap.get(succId)!
          const succES = earlyStart.get(succId) ?? projectDuration
          const succLS = lateStart.get(succId) ?? projectDuration
          const succEF = earlyFinish.get(succId) ?? projectDuration
          const succLF = lateFinish.get(succId) ?? projectDuration

          switch (depType) {
            case "finishToStart":
              // FS: Predecessor must finish before successor starts
              // LF = successor LS - lag
              return succLS - lag
            case "startToStart":
              // SS: Predecessor must start before successor starts
              // LF = successor LS - lag + task duration (to ensure predecessor finishes in time)
              // Actually: LF = LS + duration, where LS = succLS - lag
              const requiredLS = succLS - lag
              return requiredLS + task.duration
            case "finishToFinish":
              // FF: Predecessor must finish before successor finishes
              // LF = successor LF - lag
              return succLF - lag
            case "startToFinish":
              // SF: Predecessor must start before successor finishes
              // LF = successor LF - lag + task duration
              const requiredLS_SF = succLF - lag
              return requiredLS_SF + task.duration
            default:
              return succLS - lag
          }
        })
        lf = Math.min(...lfValues, projectDuration)
      }

      // Apply task constraints for backward pass
      if (task.constraintType && task.constraintDate) {
        const projectStartDate = new Date(project.startDate)
        const constraintDate = new Date(task.constraintDate)
        const constraintDays = Math.ceil((constraintDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (task.constraintType) {
          case "mustStartOn":
          case "startNoLaterThan":
            lf = Math.min(lf, constraintDays + task.duration)
            break
          case "startNoEarlierThan":
            lf = Math.max(lf, constraintDays + task.duration)
            break
          case "mustFinishOn":
          case "finishNoLaterThan":
            lf = Math.min(lf, constraintDays)
            break
          case "finishNoEarlierThan":
            lf = Math.max(lf, constraintDays)
            break
        }
      }

      lateFinish.set(taskId, lf)
      lateStart.set(taskId, lf - task.duration)
      reverseProcessed.add(taskId)

      // Add predecessors to queue
      const predecessors = this.getPredecessors(taskId, project)
      predecessors.forEach(predId => {
        if (!reverseProcessed.has(predId) && !reverseQueue.includes(predId)) {
          reverseQueue.push(predId)
        }
      })
    }

    // Calculate Float/Slack and identify critical path
    const criticalPath: string[] = []

    project.tasks.forEach(task => {
      const es = earlyStart.get(task.id) || 0
      const ef = earlyFinish.get(task.id) || 0
      const ls = lateStart.get(task.id) || 0
      const lf = lateFinish.get(task.id) || 0

      // Total Float = LS - ES = LF - EF
      const totalFloat = ls - es

      // Free Float calculation (MS Project style)
      // Free Float = min(ES of immediate successors) - EF
      const successors = this.getSuccessors(task.id, project)
      let freeFloat = totalFloat
      if (successors.length > 0) {
        const freeFloatValues = successors.map(succId => {
          const dependency = this.getDependency(task.id, succId, project)
          const depType = dependency?.type || "finishToStart"
          const lag = dependency?.lagDays || 0
          const succES = earlyStart.get(succId) || 0
          const succTask = taskMap.get(succId)!

          switch (depType) {
            case "finishToStart":
              // FF = successor ES - current EF
              return succES - ef - lag
            case "startToStart":
              // FF = successor ES - current ES - lag
              return succES - es - lag
            case "finishToFinish":
              // FF = successor EF - current EF - lag
              const succEF = earlyFinish.get(succId) || 0
              return succEF - ef - lag
            case "startToFinish":
              // FF = successor EF - current ES - lag
              const succEF2 = earlyFinish.get(succId) || 0
              return succEF2 - es - lag
            default:
              return succES - ef - lag
          }
        })
        freeFloat = Math.max(0, Math.min(...freeFloatValues))
      }

      // Task is critical if Total Float = 0
      const isCritical = totalFloat === 0

      if (isCritical) {
        criticalPath.push(task.id)
      }

      scheduleData.set(task.id, {
        taskId: task.id,
        earlyStart: es,
        earlyFinish: ef,
        lateStart: ls,
        lateFinish: lf,
        totalFloat,
        freeFloat,
        isCritical
      })
    })

    // Sort critical path by early start
    criticalPath.sort((a, b) => {
      const esA = scheduleData.get(a)?.earlyStart || 0
      const esB = scheduleData.get(b)?.earlyStart || 0
      return esA - esB
    })

    return {
      scheduleData,
      criticalPath,
      projectDuration,
      isValid: true,
      errors: []
    }
  }

  /**
   * Get all predecessor task IDs for a given task
   */
  static getPredecessors(taskId: string, project: Project): string[] {
    const task = project.tasks.find(t => t.id === taskId)
    if (!task) return []

    // Get from task dependencies
    const deps = task.dependencies || []

    // Also check project dependencies
    const projectDeps = project.dependencies?.filter(d => d.toTaskId === taskId) || []
    const depPredecessors = projectDeps.map(d => d.fromTaskId)

    // Combine and deduplicate
    return Array.from(new Set([...deps, ...depPredecessors]))
  }

  /**
   * Get all successor task IDs for a given task
   */
  static getSuccessors(taskId: string, project: Project): string[] {
    // Find tasks that have this task as a dependency
    const dependentTasks = project.tasks.filter(task =>
      (task.dependencies || []).includes(taskId)
    )

    // Also check project dependencies
    const projectDeps = project.dependencies?.filter(d => d.fromTaskId === taskId) || []
    const depSuccessors = projectDeps.map(d => d.toTaskId)

    // Combine and deduplicate
    return Array.from(new Set([
      ...dependentTasks.map(t => t.id),
      ...depSuccessors
    ]))
  }

  /**
   * Get dependency between two tasks
   */
  static getDependency(fromTaskId: string, toTaskId: string, project: Project): Dependency | null {
    // Check project dependencies first
    const projectDep = project.dependencies?.find(d =>
      d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
    )
    if (projectDep) return projectDep

    // Check if it's in task dependencies (default finish-to-start, no lag)
    const toTask = project.tasks.find(t => t.id === toTaskId)
    if (toTask?.dependencies?.includes(fromTaskId)) {
      return {
        id: `dep-${fromTaskId}-${toTaskId}`,
        fromTaskId,
        toTaskId,
        type: "finishToStart",
        lagDays: 0
      }
    }

    return null
  }

  /**
   * Validate dependencies for cycles and invalid references
   */
  static validateDependencies(project: Project): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const taskIds = new Set(project.tasks.map(t => t.id))

    // Check for invalid task references
    project.tasks.forEach(task => {
      (task.dependencies || []).forEach(depId => {
        if (!taskIds.has(depId)) {
          errors.push(`Task "${task.name}" references invalid dependency "${depId}"`)
        }
      })
    })

    // Check project dependencies
    project.dependencies?.forEach(dep => {
      if (!taskIds.has(dep.fromTaskId)) {
        errors.push(`Dependency references invalid from-task "${dep.fromTaskId}"`)
      }
      if (!taskIds.has(dep.toTaskId)) {
        errors.push(`Dependency references invalid to-task "${dep.toTaskId}"`)
      }
      if (dep.fromTaskId === dep.toTaskId) {
        errors.push(`Task "${dep.fromTaskId}" cannot depend on itself`)
      }
    })

    // Check for cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (taskId: string): boolean => {
      visited.add(taskId)
      recursionStack.add(taskId)

      const predecessors = this.getPredecessors(taskId, project)
      for (const predId of predecessors) {
        if (!visited.has(predId)) {
          if (hasCycle(predId)) return true
        } else if (recursionStack.has(predId)) {
          return true // Cycle detected
        }
      }

      recursionStack.delete(taskId)
      return false
    }

    for (const task of project.tasks) {
      if (!visited.has(task.id)) {
        if (hasCycle(task.id)) {
          errors.push(`Circular dependency detected involving task "${task.name}"`)
          break
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Update task dates based on critical path calculations
   */
  static updateTaskDates(project: Project): Project {
    const result = this.calculateCriticalPath(project)

    if (!result.isValid) {
      console.warn("Cannot update task dates due to validation errors:", result.errors)
      return project
    }

    const projectStartDate = new Date(project.startDate)

    // Update tasks with calculated dates
    const updatedTasks = project.tasks.map(task => {
      const schedule = result.scheduleData.get(task.id)
      if (!schedule) return task

      const startDate = new Date(projectStartDate)
      startDate.setDate(startDate.getDate() + schedule.earlyStart)

      const endDate = new Date(projectStartDate)
      endDate.setDate(endDate.getDate() + schedule.earlyFinish)

      return {
        ...task,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        earlyStart: schedule.earlyStart,
        earlyFinish: schedule.earlyFinish,
        lateStart: schedule.lateStart,
        lateFinish: schedule.lateFinish,
        floatDays: schedule.totalFloat,
        freeFloatDays: schedule.freeFloat,
        isCriticalPath: schedule.isCritical,
        predecessors: this.getPredecessors(task.id, project),
        successors: this.getSuccessors(task.id, project)
      }
    })

    return {
      ...project,
      tasks: updatedTasks,
      criticalPath: result.criticalPath,
      duration: result.projectDuration
    }
  }
}

