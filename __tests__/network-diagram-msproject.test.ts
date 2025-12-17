/**
 * MS Project-style Network Diagram Tests
 * Tests critical path calculations matching MS Project behavior
 */

import { NetworkDiagramService } from "../lib/network-diagram-service"
import type { Project, Task, Dependency } from "../lib/types"

describe("MS Project Network Diagram", () => {
  const createTestProject = (): Project => {
    const baseTask: Partial<Task> = {
      wbsCode: "1",
      level: 1,
      parentId: null,
      resource: null,
      cost: 0,
      isCriticalPath: false,
      dependencies: [],
      status: "notStarted",
      priority: "medium",
      assignedTo: [],
      dueDate: null,
      description: "",
      checklist: [],
      labels: [],
      progress: 0,
      earlyStart: null,
      earlyFinish: null,
      lateStart: null,
      lateFinish: null,
      floatDays: null,
      freeFloatDays: null,
      predecessors: [],
      successors: [],
      comments: [],
      attachments: [],
      createdBy: "test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      constraintType: "asSoonAsPossible",
      isMilestone: false,
      isSummary: false,
      work: 0,
      percentComplete: 0,
    }

    const task1: Task = {
      ...baseTask,
      id: "task1",
      name: "Task 1",
      duration: 5,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    } as Task

    const task2: Task = {
      ...baseTask,
      id: "task2",
      name: "Task 2",
      duration: 3,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      dependencies: ["task1"],
    } as Task

    const task3: Task = {
      ...baseTask,
      id: "task3",
      name: "Task 3",
      duration: 4,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      dependencies: ["task1"],
    } as Task

    const task4: Task = {
      ...baseTask,
      id: "task4",
      name: "Task 4",
      duration: 2,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      dependencies: ["task2", "task3"],
    } as Task

    return {
      id: "project1",
      name: "Test Project",
      description: "Test",
      type: "custom",
      status: "active",
      startDate: new Date().toISOString(),
      duration: 0,
      budget: 1000,
      tasks: [task1, task2, task3, task4],
      resources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      planType: "project",
      ownerId: "test",
      members: ["test"],
      isPublic: false,
      dependencies: [],
      criticalPath: [],
      activityFeed: [],
      automationRules: [],
    }
  }

  describe("Critical Path Calculation", () => {
    it("should calculate correct critical path for simple project", () => {
      const project = createTestProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      expect(result.isValid).toBe(true)
      expect(result.projectDuration).toBe(11) // Task1(5) -> Task2(3) -> Task4(2) = 10, or Task1(5) -> Task3(4) -> Task4(2) = 11

      // The longer path should be critical
      const criticalPathDuration = result.criticalPath.reduce((sum, taskId) => {
        const task = project.tasks.find(t => t.id === taskId)
        return sum + (task?.duration || 0)
      }, 0)
      expect(criticalPathDuration).toBeGreaterThanOrEqual(10)
    })

    it("should handle Finish-to-Start dependencies correctly", () => {
      const project = createTestProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task1Schedule = result.scheduleData.get("task1")
      const task2Schedule = result.scheduleData.get("task2")

      expect(task1Schedule?.earlyStart).toBe(0)
      expect(task1Schedule?.earlyFinish).toBe(5)
      expect(task2Schedule?.earlyStart).toBe(5) // Starts after task1 finishes
      expect(task2Schedule?.earlyFinish).toBe(8)
    })

    it("should handle Start-to-Start dependencies correctly", () => {
      const project = createTestProject()
      const dep: Dependency = {
        id: "dep1",
        fromTaskId: "task1",
        toTaskId: "task2",
        type: "startToStart",
        lagDays: 2,
      }
      project.dependencies = [dep]
      project.tasks[1].dependencies = [] // Remove FS dependency

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task1Schedule = result.scheduleData.get("task1")
      const task2Schedule = result.scheduleData.get("task2")

      expect(task1Schedule?.earlyStart).toBe(0)
      expect(task2Schedule?.earlyStart).toBe(2) // Starts 2 days after task1 starts
    })

    it("should handle Finish-to-Finish dependencies correctly", () => {
      const project = createTestProject()
      const dep: Dependency = {
        id: "dep1",
        fromTaskId: "task1",
        toTaskId: "task2",
        type: "finishToFinish",
        lagDays: 0,
      }
      project.dependencies = [dep]
      project.tasks[1].dependencies = []

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task1Schedule = result.scheduleData.get("task1")
      const task2Schedule = result.scheduleData.get("task2")

      expect(task1Schedule?.earlyFinish).toBe(5)
      // Task2 should finish when task1 finishes
      expect(task2Schedule?.earlyFinish).toBe(5)
      expect(task2Schedule?.earlyStart).toBe(2) // EF - duration = 5 - 3 = 2
    })

    it("should calculate float correctly", () => {
      const project = createTestProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      result.scheduleData.forEach((schedule, taskId) => {
        const task = project.tasks.find(t => t.id === taskId)!

        // Total Float = LS - ES = LF - EF
        const calculatedFloat = schedule.lateStart - schedule.earlyStart
        expect(schedule.totalFloat).toBe(calculatedFloat)
        expect(schedule.totalFloat).toBe(schedule.lateFinish - schedule.earlyFinish)

        // Critical tasks have zero float
        if (schedule.isCritical) {
          expect(schedule.totalFloat).toBe(0)
        }
      })
    })

    it("should identify all critical tasks correctly", () => {
      const project = createTestProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      // All tasks on critical path should have zero float
      result.criticalPath.forEach(taskId => {
        const schedule = result.scheduleData.get(taskId)
        expect(schedule?.isCritical).toBe(true)
        expect(schedule?.totalFloat).toBe(0)
      })
    })
  })

  describe("Dependency Types", () => {
    it("should handle lag time correctly", () => {
      const project = createTestProject()
      const dep: Dependency = {
        id: "dep1",
        fromTaskId: "task1",
        toTaskId: "task2",
        type: "finishToStart",
        lagDays: 3,
      }
      project.dependencies = [dep]
      project.tasks[1].dependencies = []

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task2Schedule = result.scheduleData.get("task2")
      expect(task2Schedule?.earlyStart).toBe(8) // Task1 EF(5) + lag(3) = 8
    })

    it("should handle lead time (negative lag) correctly", () => {
      const project = createTestProject()
      const dep: Dependency = {
        id: "dep1",
        fromTaskId: "task1",
        toTaskId: "task2",
        type: "finishToStart",
        lagDays: -2, // Lead time
      }
      project.dependencies = [dep]
      project.tasks[1].dependencies = []

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task2Schedule = result.scheduleData.get("task2")
      expect(task2Schedule?.earlyStart).toBe(3) // Task1 EF(5) - lead(2) = 3
    })
  })

  describe("Task Constraints", () => {
    it("should respect Must Start On constraint", () => {
      const project = createTestProject()
      const constraintDate = new Date(project.startDate)
      constraintDate.setDate(constraintDate.getDate() + 10)

      project.tasks[0].constraintType = "mustStartOn"
      project.tasks[0].constraintDate = constraintDate.toISOString()

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task1Schedule = result.scheduleData.get("task1")
      expect(task1Schedule?.earlyStart).toBe(10)
    })

    it("should respect Must Finish On constraint", () => {
      const project = createTestProject()
      const constraintDate = new Date(project.startDate)
      constraintDate.setDate(constraintDate.getDate() + 7)

      project.tasks[0].constraintType = "mustFinishOn"
      project.tasks[0].constraintDate = constraintDate.toISOString()

      const result = NetworkDiagramService.calculateCriticalPath(project)

      const task1Schedule = result.scheduleData.get("task1")
      expect(task1Schedule?.earlyFinish).toBe(7)
      expect(task1Schedule?.earlyStart).toBe(2) // EF - duration = 7 - 5 = 2
    })
  })
})

