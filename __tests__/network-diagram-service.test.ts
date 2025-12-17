/**
 * Network Diagram Service Tests
 */

import { NetworkDiagramService } from "../lib/network-diagram-service"
import type { Project, Task } from "../lib/types"

describe("NetworkDiagramService", () => {
  const createSimpleProject = (): Project => {
    const task1: Task = {
      id: "task1",
      name: "Task 1",
      wbsCode: "1",
      level: 1,
      parentId: null,
      duration: 5,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
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
    }

    const task2: Task = {
      ...task1,
      id: "task2",
      name: "Task 2",
      wbsCode: "2",
      dependencies: ["task1"],
    }

    return {
      id: "project1",
      name: "Test Project",
      description: "Test",
      type: "custom",
      status: "active",
      startDate: new Date().toISOString(),
      duration: 10,
      budget: 1000,
      tasks: [task1, task2],
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

  describe("calculateCriticalPath", () => {
    it("should calculate critical path for simple project", () => {
      const project = createSimpleProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      expect(result.isValid).toBe(true)
      expect(result.criticalPath.length).toBeGreaterThan(0)
      expect(result.projectDuration).toBeGreaterThan(0)
    })

    it("should identify tasks with zero float as critical", () => {
      const project = createSimpleProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      result.scheduleData.forEach((data, taskId) => {
        if (data.isCritical) {
          expect(data.totalFloat).toBe(0)
        }
      })
    })

    it("should calculate early start and early finish correctly", () => {
      const project = createSimpleProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      result.scheduleData.forEach((data) => {
        expect(data.earlyStart).toBeGreaterThanOrEqual(0)
        expect(data.earlyFinish).toBeGreaterThanOrEqual(data.earlyStart)
        expect(data.earlyFinish - data.earlyStart).toBeGreaterThan(0)
      })
    })

    it("should calculate late start and late finish correctly", () => {
      const project = createSimpleProject()
      const result = NetworkDiagramService.calculateCriticalPath(project)

      result.scheduleData.forEach((data) => {
        expect(data.lateStart).toBeGreaterThanOrEqual(0)
        expect(data.lateFinish).toBeGreaterThanOrEqual(data.lateStart)
      })
    })

    it("should detect circular dependencies", () => {
      const project = createSimpleProject()
      // Create circular dependency
      project.tasks[0].dependencies = ["task2"]
      project.tasks[1].dependencies = ["task1"]

      const result = NetworkDiagramService.calculateCriticalPath(project)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe("validateDependencies", () => {
    it("should validate correct dependencies", () => {
      const project = createSimpleProject()
      const result = NetworkDiagramService.validateDependencies(project)
      expect(result.isValid).toBe(true)
    })

    it("should detect invalid task references", () => {
      const project = createSimpleProject()
      project.tasks[0].dependencies = ["nonexistent"]
      const result = NetworkDiagramService.validateDependencies(project)
      expect(result.isValid).toBe(false)
    })
  })

  describe("updateTaskDates", () => {
    it("should update task dates based on critical path", () => {
      const project = createSimpleProject()
      const updated = NetworkDiagramService.updateTaskDates(project)

      updated.tasks.forEach((task) => {
        expect(task.earlyStart).not.toBeNull()
        expect(task.earlyFinish).not.toBeNull()
        expect(task.lateStart).not.toBeNull()
        expect(task.lateFinish).not.toBeNull()
      })
    })
  })
})

