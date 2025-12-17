/**
 * Critical Path Validator
 * Validates critical path calculations match MS Project behavior
 */

import { NetworkDiagramService } from "./network-diagram-service"
import type { Project } from "./types"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  details: {
    projectDuration: number
    criticalPathLength: number
    tasksWithFloat: number
    tasksOnCriticalPath: number
  }
}

/**
 * Validate critical path calculations
 */
export function validateCriticalPath(project: Project): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const result = NetworkDiagramService.calculateCriticalPath(project)

  if (!result.isValid) {
    return {
      isValid: false,
      errors: result.errors,
      warnings: [],
      details: {
        projectDuration: 0,
        criticalPathLength: 0,
        tasksWithFloat: 0,
        tasksOnCriticalPath: 0,
      }
    }
  }

  // Validation checks
  let tasksWithFloat = 0
  let tasksOnCriticalPath = 0

  project.tasks.forEach(task => {
    const schedule = result.scheduleData.get(task.id)
    if (!schedule) {
      errors.push(`Task "${task.name}" missing schedule data`)
      return
    }

    // Validate ES <= EF
    if (schedule.earlyStart > schedule.earlyFinish) {
      errors.push(`Task "${task.name}": ES(${schedule.earlyStart}) > EF(${schedule.earlyFinish})`)
    }

    // Validate LS <= LF
    if (schedule.lateStart > schedule.lateFinish) {
      errors.push(`Task "${task.name}": LS(${schedule.lateStart}) > LF(${schedule.lateFinish})`)
    }

    // Validate EF = ES + duration
    const calculatedEF = schedule.earlyStart + task.duration
    if (Math.abs(schedule.earlyFinish - calculatedEF) > 0.01) {
      errors.push(`Task "${task.name}": EF(${schedule.earlyFinish}) != ES(${schedule.earlyStart}) + Duration(${task.duration})`)
    }

    // Validate LF = LS + duration
    const calculatedLF = schedule.lateStart + task.duration
    if (Math.abs(schedule.lateFinish - calculatedLF) > 0.01) {
      errors.push(`Task "${task.name}": LF(${schedule.lateFinish}) != LS(${schedule.lateStart}) + Duration(${task.duration})`)
    }

    // Validate Total Float = LS - ES = LF - EF
    const float1 = schedule.lateStart - schedule.earlyStart
    const float2 = schedule.lateFinish - schedule.earlyFinish
    if (Math.abs(schedule.totalFloat - float1) > 0.01 || Math.abs(schedule.totalFloat - float2) > 0.01) {
      errors.push(`Task "${task.name}": Total Float calculation incorrect`)
    }

    // Validate critical path: Float = 0 for critical tasks
    if (schedule.isCritical && schedule.totalFloat !== 0) {
      errors.push(`Task "${task.name}": Marked as critical but has float ${schedule.totalFloat}`)
    }

    // Validate non-critical tasks have float > 0
    if (!schedule.isCritical && schedule.totalFloat === 0) {
      warnings.push(`Task "${task.name}": Not marked as critical but has zero float`)
    }

    if (schedule.totalFloat > 0) {
      tasksWithFloat++
    }

    if (schedule.isCritical) {
      tasksOnCriticalPath++
    }
  })

  // Validate critical path is continuous
  const criticalPath = result.criticalPath
  for (let i = 0; i < criticalPath.length - 1; i++) {
    const currentTask = project.tasks.find(t => t.id === criticalPath[i])
    const nextTask = project.tasks.find(t => t.id === criticalPath[i + 1])

    if (currentTask && nextTask) {
      const currentSchedule = result.scheduleData.get(currentTask.id)!
      const nextSchedule = result.scheduleData.get(nextTask.id)!

      // Check if there's a dependency
      const hasDependency =
        (currentTask.dependencies || []).includes(nextTask.id) ||
        project.dependencies?.some(d => d.fromTaskId === currentTask.id && d.toTaskId === nextTask.id)

      if (!hasDependency) {
        warnings.push(`Critical path may have gaps: ${currentTask.name} -> ${nextTask.name}`)
      }

      // Validate EF of current = ES of next (for FS dependencies)
      const dep = NetworkDiagramService.getDependency(currentTask.id, nextTask.id, project)
      if (dep?.type === "finishToStart" && dep.lagDays === 0) {
        if (currentSchedule.earlyFinish !== nextSchedule.earlyStart) {
          warnings.push(`Critical path timing mismatch: ${currentTask.name}.EF(${currentSchedule.earlyFinish}) != ${nextTask.name}.ES(${nextSchedule.earlyStart})`)
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      projectDuration: result.projectDuration,
      criticalPathLength: criticalPath.length,
      tasksWithFloat,
      tasksOnCriticalPath,
    }
  }
}

