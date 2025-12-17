/**
 * Critical Path Validation Tests
 * Validates calculations match MS Project behavior exactly
 */

import { NetworkDiagramService } from "../lib/network-diagram-service"
import type { Project, Task, Dependency } from "../lib/types"

describe("MS Project Critical Path Validation", () => {
  /**
   * Test Case 1: Simple Finish-to-Start chain
   * Task A (5d) -> Task B (3d) -> Task C (2d)
   * Expected: Critical path = A->B->C, Duration = 10 days
   */
  it("should calculate simple FS chain correctly", () => {
    const project = createFSChainProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)
    expect(result.projectDuration).toBe(10)
    expect(result.criticalPath).toEqual(["taskA", "taskB", "taskC"])

    // Verify all tasks are critical
    result.criticalPath.forEach(taskId => {
      const schedule = result.scheduleData.get(taskId)
      expect(schedule?.totalFloat).toBe(0)
      expect(schedule?.isCritical).toBe(true)
    })

    // Verify dates
    const taskA = result.scheduleData.get("taskA")
    const taskB = result.scheduleData.get("taskB")
    const taskC = result.scheduleData.get("taskC")

    expect(taskA?.earlyStart).toBe(0)
    expect(taskA?.earlyFinish).toBe(5)
    expect(taskB?.earlyStart).toBe(5)
    expect(taskB?.earlyFinish).toBe(8)
    expect(taskC?.earlyStart).toBe(8)
    expect(taskC?.earlyFinish).toBe(10)
  })

  /**
   * Test Case 2: Parallel paths with different durations
   * Task A (5d) -> Task B (3d) -> Task D (2d)
   * Task A (5d) -> Task C (7d) -> Task D (2d)
   * Expected: Critical path = A->C->D, Duration = 14 days
   */
  it("should identify longest path as critical", () => {
    const project = createParallelPathsProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)
    expect(result.projectDuration).toBe(14) // A(5) + C(7) + D(2) = 14
    expect(result.criticalPath).toContain("taskA")
    expect(result.criticalPath).toContain("taskC")
    expect(result.criticalPath).toContain("taskD")
    expect(result.criticalPath).not.toContain("taskB") // Task B has float

    // Task B should have float
    const taskB = result.scheduleData.get("taskB")
    expect(taskB?.totalFloat).toBeGreaterThan(0)
    expect(taskB?.isCritical).toBe(false)
  })

  /**
   * Test Case 3: Start-to-Start dependency
   * Task A (5d) -[SS+2d]-> Task B (3d)
   * Expected: Task B starts 2 days after Task A starts
   */
  it("should handle Start-to-Start dependencies correctly", () => {
    const project = createSSDependencyProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)

    const taskA = result.scheduleData.get("taskA")
    const taskB = result.scheduleData.get("taskB")

    expect(taskA?.earlyStart).toBe(0)
    expect(taskB?.earlyStart).toBe(2) // Starts 2 days after A starts
    expect(taskB?.earlyFinish).toBe(5) // ES(2) + Duration(3) = 5
  })

  /**
   * Test Case 4: Finish-to-Finish dependency
   * Task A (5d) -[FF]-> Task B (3d)
   * Expected: Task B finishes when Task A finishes
   */
  it("should handle Finish-to-Finish dependencies correctly", () => {
    const project = createFFDependencyProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)

    const taskA = result.scheduleData.get("taskA")
    const taskB = result.scheduleData.get("taskB")

    expect(taskA?.earlyFinish).toBe(5)
    expect(taskB?.earlyFinish).toBe(5) // Finishes when A finishes
    expect(taskB?.earlyStart).toBe(2) // EF(5) - Duration(3) = 2
  })

  /**
   * Test Case 5: Lag time
   * Task A (5d) -[FS+3d]-> Task B (3d)
   * Expected: Task B starts 3 days after Task A finishes
   */
  it("should handle lag time correctly", () => {
    const project = createLagTimeProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)

    const taskA = result.scheduleData.get("taskA")
    const taskB = result.scheduleData.get("taskB")

    expect(taskA?.earlyFinish).toBe(5)
    expect(taskB?.earlyStart).toBe(8) // EF(5) + Lag(3) = 8
    expect(taskB?.earlyFinish).toBe(11)
  })

  /**
   * Test Case 6: Lead time (negative lag)
   * Task A (5d) -[FS-2d]-> Task B (3d)
   * Expected: Task B starts 2 days before Task A finishes
   */
  it("should handle lead time (negative lag) correctly", () => {
    const project = createLeadTimeProject()
    const result = NetworkDiagramService.calculateCriticalPath(project)

    expect(result.isValid).toBe(true)

    const taskA = result.scheduleData.get("taskA")
    const taskB = result.scheduleData.get("taskB")

    expect(taskA?.earlyFinish).toBe(5)
    expect(taskB?.earlyStart).toBe(3) // EF(5) - Lead(2) = 3
    expect(taskB?.earlyFinish).toBe(6)
  })

  // Helper functions to create test projects
  function createBaseTask(id: string, name: string, duration: number, deps: string[] = []): Task {
    return {
      id,
      name,
      wbsCode: id.replace("task", ""),
      level: 1,
      parentId: null,
      duration,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      resource: null,
      cost: 0,
      isCriticalPath: false,
      dependencies: deps,
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
      predecessors: deps,
      successors: [],
      comments: [],
      attachments: [],
      createdBy: "test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      constraintType: "asSoonAsPossible",
      isMilestone: false,
      isSummary: false,
      work: duration * 8,
      percentComplete: 0,
    }
  }

  function createBaseProject(tasks: Task[], dependencies: Dependency[] = []): Project {
    return {
      id: "test-project",
      name: "Test Project",
      description: "Test",
      type: "custom",
      status: "active",
      startDate: new Date().toISOString(),
      duration: 0,
      budget: 1000,
      tasks,
      resources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      planType: "project",
      ownerId: "test",
      members: ["test"],
      isPublic: false,
      dependencies,
      criticalPath: [],
      activityFeed: [],
      automationRules: [],
    }
  }

  function createFSChainProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3, ["taskA"])
    const taskC = createBaseTask("taskC", "Task C", 2, ["taskB"])
    return createBaseProject([taskA, taskB, taskC])
  }

  function createParallelPathsProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3, ["taskA"])
    const taskC = createBaseTask("taskC", "Task C", 7, ["taskA"])
    const taskD = createBaseTask("taskD", "Task D", 2, ["taskB", "taskC"])
    return createBaseProject([taskA, taskB, taskC, taskD])
  }

  function createSSDependencyProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3)
    const dep: Dependency = {
      id: "dep1",
      fromTaskId: "taskA",
      toTaskId: "taskB",
      type: "startToStart",
      lagDays: 2,
    }
    return createBaseProject([taskA, taskB], [dep])
  }

  function createFFDependencyProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3)
    const dep: Dependency = {
      id: "dep1",
      fromTaskId: "taskA",
      toTaskId: "taskB",
      type: "finishToFinish",
      lagDays: 0,
    }
    return createBaseProject([taskA, taskB], [dep])
  }

  function createLagTimeProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3)
    const dep: Dependency = {
      id: "dep1",
      fromTaskId: "taskA",
      toTaskId: "taskB",
      type: "finishToStart",
      lagDays: 3,
    }
    return createBaseProject([taskA, taskB], [dep])
  }

  function createLeadTimeProject(): Project {
    const taskA = createBaseTask("taskA", "Task A", 5)
    const taskB = createBaseTask("taskB", "Task B", 3)
    const dep: Dependency = {
      id: "dep1",
      fromTaskId: "taskA",
      toTaskId: "taskB",
      type: "finishToStart",
      lagDays: -2, // Lead time
    }
    return createBaseProject([taskA, taskB], [dep])
  }
})

