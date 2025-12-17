/**
 * Automation Engine Tests
 */

import { AutomationEngine } from "../lib/automation-engine"
import type { Project, Task, AutomationRule } from "../lib/types"

describe("AutomationEngine", () => {
  const createTestProject = (): Project => {
    const task: Task = {
      id: "task1",
      name: "Test Task",
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

    return {
      id: "project1",
      name: "Test Project",
      description: "Test",
      type: "custom",
      status: "active",
      startDate: new Date().toISOString(),
      duration: 10,
      budget: 1000,
      tasks: [task],
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

  describe("evaluateCondition", () => {
    it("should evaluate simple conditions", () => {
      const project = createTestProject()
      const task = project.tasks[0]

      const context = {
        project,
        task,
      }

      const condition = JSON.stringify({
        field: "task.status",
        operator: "equals",
        value: "notStarted",
      })

      const result = AutomationEngine.evaluateCondition(condition, context)
      expect(result).toBe(true)
    })
  })

  describe("executeAction", () => {
    it("should execute changeStatus action", async () => {
      const project = createTestProject()
      const task = project.tasks[0]

      const action = JSON.stringify({
        type: "changeStatus",
        params: { status: "inProgress" },
      })

      // Mock updateProject
      const originalUpdate = require("../lib/storage").updateProject
      const mockUpdate = jest.fn()
      require("../lib/storage").updateProject = mockUpdate

      await AutomationEngine.executeAction(action, project.id, { project, task })

      expect(mockUpdate).toHaveBeenCalled()

      // Restore
      require("../lib/storage").updateProject = originalUpdate
    })
  })
})

