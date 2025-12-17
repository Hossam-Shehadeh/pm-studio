import type { Project, ProjectType } from "./types"
import { generateWBS } from "./ai-generator"
import { migrateProjectTasks, initializeTask } from "./task-utils"

const STORAGE_KEY = "ai-project-planner-projects"

export function getProjects(): Project[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []

  const projects: Project[] = JSON.parse(data)

  // Migrate old projects to new format
  return projects.map(project => {
    // Migrate tasks
    const migratedTasks = migrateProjectTasks(project.tasks)

    // Ensure project has all new fields
    return {
      ...project,
      tasks: migratedTasks,
      planType: project.planType || "project",
      ownerId: project.ownerId || "current-user",
      members: project.members || [project.ownerId || "current-user"],
      isPublic: project.isPublic ?? false,
      dependencies: project.dependencies || [],
      criticalPath: project.criticalPath || [],
      activityFeed: project.activityFeed || [],
      automationRules: project.automationRules || [],
    }
  })
}

export function getProjectById(id: string): Project | null {
  const projects = getProjects()
  return projects.find((p) => p.id === id) || null
}

export function saveProject(project: Project): void {
  const projects = getProjects()
  const index = projects.findIndex((p) => p.id === project.id)
  if (index >= 0) {
    projects[index] = project
  } else {
    projects.push(project)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function updateProject(project: Project): void {
  project.updatedAt = new Date().toISOString()
  saveProject(project)
}

export function createProject({
  name,
  description,
  type,
  planType = "project",
  ownerId = "current-user",
}: {
  name: string
  description: string
  type: ProjectType
  planType?: "marketing" | "sales" | "software" | "it" | "hr" | "project" | "custom"
  ownerId?: string
}): Project {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 7) // Start next week

  const { tasks, resources, duration, budget } = generateWBS(type, startDate)

  // Initialize tasks with Planner fields using utility function
  const initializedTasks = tasks.map(task =>
    initializeTask(task, { ownerId, createdAt: new Date().toISOString() })
  )

  const project: Project = {
    id: crypto.randomUUID(),
    name,
    description,
    type,
    status: "active",
    startDate: startDate.toISOString(),
    duration,
    budget,
    tasks: initializedTasks,
    resources,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planType: planType as any,
    ownerId,
    members: [ownerId],
    isPublic: false,
    dependencies: [],
    criticalPath: [],
    activityFeed: [],
    automationRules: [],
  }

  saveProject(project)
  return project
}
