export type ProjectType =
  | "mobile-app"
  | "e-commerce"
  | "saas-platform"
  | "crm-system"
  | "booking-app"
  | "hospital-system"
  | "school-system"
  | "custom"

export type ProjectStatus = "draft" | "active" | "completed" | "on-hold"
export type TaskStatus = "notStarted" | "inProgress" | "completed" | "blocked" | "deferred"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type DependencyType = "finishToStart" | "startToStart" | "finishToFinish" | "startToFinish"
export type TaskConstraint = "asSoonAsPossible" | "asLateAsPossible" | "mustStartOn" | "mustFinishOn" | "startNoEarlierThan" | "startNoLaterThan" | "finishNoEarlierThan" | "finishNoLaterThan"
export type PlanType = "marketing" | "sales" | "software" | "it" | "hr" | "project" | "custom"

export interface Dependency {
  id: string
  fromTaskId: string
  toTaskId: string
  type: DependencyType
  lagDays: number // Lag or lead time
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  mentions: string[] // User IDs mentioned
  createdAt: string
  updatedAt: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedBy: string
  uploadedAt: string
  version: number
}

export interface TaskActivity {
  id: string
  taskId: string
  projectId: string
  userId: string
  userName: string
  action: string // "created", "updated", "commented", "assigned", etc.
  details: string
  timestamp: string
}

export interface AutomationRule {
  id: string
  projectId: string
  name: string
  trigger: string // "taskCreated", "statusChanged", "deadlineApproaching", etc.
  condition: string // JSON condition
  action: string // "changeStatus", "sendNotification", "createTask", etc.
  enabled: boolean
}

export interface Task {
  id: string
  name: string
  wbsCode: string
  level: number
  parentId: string | null
  duration: number
  startDate: string
  endDate: string
  resource: string | null
  cost: number
  isCriticalPath: boolean
  dependencies: string[]

  // Microsoft Planner fields
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string[] // User IDs
  dueDate: string | null
  description: string
  checklist: Array<{ id: string; text: string; completed: boolean }>
  labels: string[]
  progress: number // 0-100

  // Network Diagram / Critical Path fields
  earlyStart: number | null // Days from project start
  earlyFinish: number | null
  lateStart: number | null
  lateFinish: number | null
  floatDays: number | null // Total float/slack
  freeFloatDays: number | null // Free float
  predecessors: string[] // Task IDs that must complete before this
  successors: string[] // Task IDs that depend on this

  // MS Project specific fields
  constraintType?: TaskConstraint
  constraintDate?: string // Date for constraint
  isMilestone?: boolean // True if task is a milestone (0 duration)
  isSummary?: boolean // True if task is a summary task (has children)
  work?: number // Work hours
  percentComplete?: number // 0-100
  actualStart?: string | null
  actualFinish?: string | null
  baselineStart?: string | null
  baselineFinish?: string | null
  baselineDuration?: number | null

  // Collaboration
  comments: TaskComment[]
  attachments: TaskAttachment[]

  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Resource {
  id: string
  name: string
  role: string
  rate: number
}

export interface Project {
  id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  startDate: string
  duration: number
  budget: number
  tasks: Task[]
  resources: Resource[]
  createdAt: string
  updatedAt: string

  // Microsoft Planner fields
  planType: PlanType
  ownerId: string
  members: string[] // User IDs
  isPublic: boolean

  // Network Diagram
  dependencies: Dependency[]
  criticalPath: string[] // Task IDs on critical path

  // Collaboration
  activityFeed: TaskActivity[]

  // Automation
  automationRules: AutomationRule[]
}
