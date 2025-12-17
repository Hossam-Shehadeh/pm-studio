/**
 * Planner Templates
 * Pre-built templates for different project types
 */

import type { ProjectType, PlanType } from "./types"
import { generateWBS } from "./ai-generator"

export interface PlannerTemplate {
  id: string
  name: string
  description: string
  planType: PlanType
  projectType: ProjectType
  icon: string
  color: string
  phases: Array<{
    name: string
    description: string
    tasks: Array<{
      name: string
      description: string
      duration: number
      resource: string
      priority: "low" | "medium" | "high" | "urgent"
    }>
  }>
}

export const PLANNER_TEMPLATES: PlannerTemplate[] = [
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    description: "Launch a comprehensive marketing campaign with content, social media, and analytics",
    planType: "marketing",
    projectType: "custom",
    icon: "📢",
    color: "chart-1",
    phases: [
      {
        name: "1. Campaign Planning",
        description: "Define strategy, target audience, and goals",
        tasks: [
          { name: "Market Research", description: "Analyze target market and competitors", duration: 5, resource: "Project Manager", priority: "high" },
          { name: "Campaign Strategy", description: "Define campaign objectives and KPIs", duration: 3, resource: "Project Manager", priority: "high" },
          { name: "Budget Planning", description: "Allocate budget across channels", duration: 2, resource: "Project Manager", priority: "medium" },
        ],
      },
      {
        name: "2. Content Creation",
        description: "Develop marketing materials and content",
        tasks: [
          { name: "Content Calendar", description: "Plan content schedule", duration: 3, resource: "UI/UX Designer", priority: "high" },
          { name: "Design Assets", description: "Create visual materials", duration: 10, resource: "UI/UX Designer", priority: "high" },
          { name: "Copywriting", description: "Write marketing copy", duration: 7, resource: "UI/UX Designer", priority: "medium" },
        ],
      },
      {
        name: "3. Channel Setup",
        description: "Configure marketing channels",
        tasks: [
          { name: "Social Media Setup", description: "Configure social media accounts", duration: 5, resource: "Frontend Developer", priority: "medium" },
          { name: "Email Marketing Setup", description: "Set up email campaigns", duration: 4, resource: "Backend Developer", priority: "medium" },
          { name: "Analytics Configuration", description: "Set up tracking and analytics", duration: 3, resource: "Backend Developer", priority: "high" },
        ],
      },
      {
        name: "4. Launch & Monitor",
        description: "Launch campaign and monitor performance",
        tasks: [
          { name: "Campaign Launch", description: "Go live with campaign", duration: 1, resource: "Project Manager", priority: "urgent" },
          { name: "Performance Monitoring", description: "Track KPIs and metrics", duration: 14, resource: "Project Manager", priority: "high" },
          { name: "Optimization", description: "Adjust based on performance data", duration: 7, resource: "Project Manager", priority: "medium" },
        ],
      },
    ],
  },
  {
    id: "sales-pipeline",
    name: "Sales Pipeline",
    description: "Manage sales process from lead generation to closing",
    planType: "sales",
    projectType: "custom",
    icon: "💰",
    color: "chart-2",
    phases: [
      {
        name: "1. Lead Generation",
        description: "Identify and qualify leads",
        tasks: [
          { name: "Lead Source Setup", description: "Configure lead sources", duration: 3, resource: "Project Manager", priority: "high" },
          { name: "Lead Qualification", description: "Define qualification criteria", duration: 2, resource: "Project Manager", priority: "high" },
        ],
      },
      {
        name: "2. Prospecting",
        description: "Reach out to qualified leads",
        tasks: [
          { name: "Outreach Campaign", description: "Email and call campaigns", duration: 10, resource: "Project Manager", priority: "high" },
          { name: "Follow-up System", description: "Automated follow-up sequences", duration: 5, resource: "Backend Developer", priority: "medium" },
        ],
      },
      {
        name: "3. Sales Process",
        description: "Move leads through sales stages",
        tasks: [
          { name: "Discovery Calls", description: "Initial sales calls", duration: 14, resource: "Project Manager", priority: "high" },
          { name: "Proposal Creation", description: "Create custom proposals", duration: 7, resource: "Project Manager", priority: "high" },
          { name: "Negotiation", description: "Contract negotiations", duration: 10, resource: "Project Manager", priority: "urgent" },
        ],
      },
      {
        name: "4. Closing",
        description: "Finalize deals and onboarding",
        tasks: [
          { name: "Contract Signing", description: "Finalize contracts", duration: 5, resource: "Project Manager", priority: "urgent" },
          { name: "Customer Onboarding", description: "Onboard new customers", duration: 7, resource: "Project Manager", priority: "high" },
        ],
      },
    ],
  },
  {
    id: "software-development",
    name: "Software Development (Agile/Sprint)",
    description: "Agile software development with sprints and iterations",
    planType: "software",
    projectType: "mobile-app",
    icon: "💻",
    color: "chart-3",
    phases: [
      {
        name: "Sprint 1: Foundation",
        description: "Set up project infrastructure",
        tasks: [
          { name: "Sprint Planning", description: "Plan sprint goals and tasks", duration: 1, resource: "Project Manager", priority: "high" },
          { name: "Environment Setup", description: "Set up dev, staging, production", duration: 3, resource: "DevOps Engineer", priority: "high" },
          { name: "Architecture Design", description: "Design system architecture", duration: 5, resource: "Backend Developer", priority: "high" },
        ],
      },
      {
        name: "Sprint 2: Core Features",
        description: "Build core functionality",
        tasks: [
          { name: "API Development", description: "Build REST APIs", duration: 10, resource: "Backend Developer", priority: "high" },
          { name: "UI Components", description: "Build reusable UI components", duration: 10, resource: "Frontend Developer", priority: "high" },
          { name: "Database Setup", description: "Design and implement database", duration: 5, resource: "Database Engineer", priority: "high" },
        ],
      },
      {
        name: "Sprint 3: Integration",
        description: "Integrate features and test",
        tasks: [
          { name: "Feature Integration", description: "Integrate frontend and backend", duration: 8, resource: "Frontend Developer", priority: "high" },
          { name: "Testing", description: "Unit and integration tests", duration: 7, resource: "QA Engineer", priority: "high" },
          { name: "Bug Fixes", description: "Fix identified issues", duration: 5, resource: "Backend Developer", priority: "medium" },
        ],
      },
      {
        name: "Sprint 4: Launch",
        description: "Prepare for production launch",
        tasks: [
          { name: "Performance Optimization", description: "Optimize for production", duration: 5, resource: "Backend Developer", priority: "high" },
          { name: "Security Audit", description: "Security review and fixes", duration: 3, resource: "Backend Developer", priority: "urgent" },
          { name: "Production Deployment", description: "Deploy to production", duration: 2, resource: "DevOps Engineer", priority: "urgent" },
        ],
      },
    ],
  },
  {
    id: "it-request",
    name: "IT Request Management",
    description: "Manage IT service requests and tickets",
    planType: "it",
    projectType: "custom",
    icon: "🖥️",
    color: "chart-4",
    phases: [
      {
        name: "1. Request Intake",
        description: "Receive and categorize requests",
        tasks: [
          { name: "Request Submission", description: "Submit IT request", duration: 1, resource: "Project Manager", priority: "high" },
          { name: "Request Triage", description: "Categorize and prioritize", duration: 1, resource: "Project Manager", priority: "high" },
        ],
      },
      {
        name: "2. Analysis",
        description: "Analyze requirements and feasibility",
        tasks: [
          { name: "Requirements Analysis", description: "Analyze technical requirements", duration: 3, resource: "Backend Developer", priority: "high" },
          { name: "Feasibility Study", description: "Assess technical feasibility", duration: 2, resource: "Backend Developer", priority: "medium" },
        ],
      },
      {
        name: "3. Implementation",
        description: "Implement the solution",
        tasks: [
          { name: "Solution Design", description: "Design technical solution", duration: 5, resource: "Backend Developer", priority: "high" },
          { name: "Development", description: "Implement solution", duration: 10, resource: "Backend Developer", priority: "high" },
          { name: "Testing", description: "Test solution", duration: 3, resource: "QA Engineer", priority: "high" },
        ],
      },
      {
        name: "4. Deployment",
        description: "Deploy and close request",
        tasks: [
          { name: "Deployment", description: "Deploy to production", duration: 2, resource: "DevOps Engineer", priority: "urgent" },
          { name: "User Acceptance", description: "Get user sign-off", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Request Closure", description: "Close request ticket", duration: 1, resource: "Project Manager", priority: "medium" },
        ],
      },
    ],
  },
  {
    id: "hr-onboarding",
    name: "HR Onboarding",
    description: "Complete employee onboarding process",
    planType: "hr",
    projectType: "custom",
    icon: "👥",
    color: "chart-5",
    phases: [
      {
        name: "1. Pre-boarding",
        description: "Prepare for new employee arrival",
        tasks: [
          { name: "Offer Acceptance", description: "Employee accepts offer", duration: 1, resource: "Project Manager", priority: "urgent" },
          { name: "Paperwork Preparation", description: "Prepare employment documents", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Equipment Ordering", description: "Order laptop and equipment", duration: 3, resource: "Project Manager", priority: "high" },
        ],
      },
      {
        name: "2. First Day",
        description: "Welcome and orientation",
        tasks: [
          { name: "Welcome Session", description: "Welcome new employee", duration: 1, resource: "Project Manager", priority: "urgent" },
          { name: "Office Tour", description: "Show office facilities", duration: 1, resource: "Project Manager", priority: "medium" },
          { name: "System Access Setup", description: "Set up accounts and access", duration: 2, resource: "Backend Developer", priority: "high" },
        ],
      },
      {
        name: "3. Training",
        description: "Provide necessary training",
        tasks: [
          { name: "Company Orientation", description: "Company culture and policies", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Role Training", description: "Job-specific training", duration: 5, resource: "Project Manager", priority: "high" },
          { name: "Tool Training", description: "Training on company tools", duration: 3, resource: "Project Manager", priority: "medium" },
        ],
      },
      {
        name: "4. Integration",
        description: "Help employee integrate into team",
        tasks: [
          { name: "Team Introductions", description: "Introduce to team members", duration: 1, resource: "Project Manager", priority: "medium" },
          { name: "Mentor Assignment", description: "Assign onboarding mentor", duration: 1, resource: "Project Manager", priority: "high" },
          { name: "30-Day Check-in", description: "First month review", duration: 1, resource: "Project Manager", priority: "medium" },
        ],
      },
    ],
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Standard project management template with full WBS",
    planType: "project",
    projectType: "custom",
    icon: "📊",
    color: "primary",
    phases: [
      {
        name: "1. Project Initiation",
        description: "Kick off the project",
        tasks: [
          { name: "Project Charter", description: "Create project charter", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Stakeholder Identification", description: "Identify all stakeholders", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Team Assembly", description: "Assemble project team", duration: 3, resource: "Project Manager", priority: "high" },
        ],
      },
      {
        name: "2. Planning",
        description: "Plan project in detail",
        tasks: [
          { name: "WBS Creation", description: "Create work breakdown structure", duration: 5, resource: "Project Manager", priority: "high" },
          { name: "Schedule Development", description: "Develop project schedule", duration: 5, resource: "Project Manager", priority: "high" },
          { name: "Budget Planning", description: "Create project budget", duration: 3, resource: "Project Manager", priority: "high" },
          { name: "Risk Management", description: "Identify and plan for risks", duration: 3, resource: "Project Manager", priority: "medium" },
        ],
      },
      {
        name: "3. Execution",
        description: "Execute project work",
        tasks: [
          { name: "Task Execution", description: "Execute project tasks", duration: 30, resource: "Project Manager", priority: "high" },
          { name: "Progress Monitoring", description: "Monitor project progress", duration: 30, resource: "Project Manager", priority: "high" },
          { name: "Quality Assurance", description: "Ensure quality standards", duration: 20, resource: "QA Engineer", priority: "high" },
        ],
      },
      {
        name: "4. Closure",
        description: "Close out the project",
        tasks: [
          { name: "Final Deliverables", description: "Complete final deliverables", duration: 5, resource: "Project Manager", priority: "urgent" },
          { name: "Project Review", description: "Conduct project review", duration: 2, resource: "Project Manager", priority: "high" },
          { name: "Lessons Learned", description: "Document lessons learned", duration: 2, resource: "Project Manager", priority: "medium" },
        ],
      },
    ],
  },
]

/**
 * Create a project from a template
 */
export function createProjectFromTemplate(
  templateId: string,
  name: string,
  description: string,
  ownerId: string = "current-user"
) {
  const template = PLANNER_TEMPLATES.find(t => t.id === templateId)
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  // Use existing WBS generator for the project type, then enhance with template data
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 7)

  const { tasks: baseTasks, resources, duration, budget } = generateWBS(template.projectType, startDate)

  // Enhance tasks with template-specific data
  const enhancedTasks = baseTasks.map((task, index) => {
    // Find matching template task by name or position
    const templateTask = template.phases
      .flatMap(p => p.tasks)
      .find(t => t.name === task.name || task.name.includes(t.name.split(" ")[0]))

    return {
      ...task,
      status: "notStarted" as const,
      priority: templateTask?.priority || "medium" as const,
      assignedTo: task.resource ? [task.resource] : [],
      dueDate: task.endDate,
      description: templateTask?.description || "",
      checklist: [],
      labels: [],
      progress: 0,
      earlyStart: null,
      earlyFinish: null,
      lateStart: null,
      lateFinish: null,
      floatDays: null,
      freeFloatDays: null,
      predecessors: task.dependencies || [],
      successors: [],
      comments: [],
      attachments: [],
      createdBy: ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    id: crypto.randomUUID(),
    name,
    description,
    type: template.projectType,
    status: "active" as const,
    startDate: startDate.toISOString(),
    duration,
    budget,
    tasks: enhancedTasks,
    resources,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    planType: template.planType,
    ownerId,
    members: [ownerId],
    isPublic: false,
    dependencies: [],
    criticalPath: [],
    activityFeed: [],
    automationRules: [],
  }
}

