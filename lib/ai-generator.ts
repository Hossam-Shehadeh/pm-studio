import type { Task, Resource, ProjectType } from "./types"
import { RESOURCE_RATES } from "./constants"

interface WBSTemplate {
  phases: Array<{
    name: string
    tasks: Array<{
      name: string
      duration: number
      resource: string
      dependencies?: number[]
      subtasks?: Array<{
        name: string
        duration: number
        resource: string
        dependencies?: number[]
      }>
    }>
  }>
}

const templates: Record<ProjectType, WBSTemplate> = {
  "mobile-app": {
    phases: [
      {
        name: "1. Project Planning & Initiation",
        tasks: [
          {
            name: "1.1 Project Kickoff & Setup",
            duration: 3,
            resource: "Project Manager",
            subtasks: [
              { name: "Stakeholder Meeting", duration: 1, resource: "Project Manager" },
              { name: "Project Charter Creation", duration: 1, resource: "Project Manager" },
              { name: "Team Assembly", duration: 1, resource: "Project Manager" },
            ],
          },
          {
            name: "1.2 Requirements Gathering & Analysis",
            duration: 8,
            resource: "Project Manager",
            subtasks: [
              { name: "User Requirements Collection", duration: 3, resource: "Project Manager" },
              { name: "Business Requirements Analysis", duration: 2, resource: "Project Manager" },
              { name: "Requirements Documentation", duration: 2, resource: "Project Manager" },
              { name: "Requirements Review & Approval", duration: 1, resource: "Project Manager" },
            ],
          },
          {
            name: "1.3 Technical Architecture Design",
            duration: 10,
            resource: "Backend Developer",
            subtasks: [
              { name: "System Architecture Design", duration: 4, resource: "Backend Developer" },
              { name: "Technology Stack Selection", duration: 2, resource: "Backend Developer" },
              { name: "API Design & Documentation", duration: 3, resource: "Backend Developer" },
              { name: "Architecture Review", duration: 1, resource: "Backend Developer" },
            ],
          },
        ],
      },
      {
        name: "2. Design Phase",
        tasks: [
          {
            name: "2.1 UI/UX Design",
            duration: 15,
            resource: "UI/UX Designer",
            subtasks: [
              { name: "User Research & Personas", duration: 3, resource: "UI/UX Designer" },
              { name: "Wireframing", duration: 4, resource: "UI/UX Designer" },
              { name: "Visual Design", duration: 5, resource: "UI/UX Designer" },
              { name: "Design Review & Iteration", duration: 3, resource: "UI/UX Designer" },
            ],
          },
          {
            name: "2.2 Design System Creation",
            duration: 8,
            resource: "UI/UX Designer",
            subtasks: [
              { name: "Component Library Design", duration: 4, resource: "UI/UX Designer" },
              { name: "Style Guide Development", duration: 2, resource: "UI/UX Designer" },
              { name: "Design System Documentation", duration: 2, resource: "UI/UX Designer" },
            ],
          },
          {
            name: "2.3 Prototype Development",
            duration: 7,
            resource: "Frontend Developer",
            subtasks: [
              { name: "Interactive Prototype Creation", duration: 4, resource: "Frontend Developer" },
              { name: "User Testing & Feedback", duration: 2, resource: "Frontend Developer" },
              { name: "Prototype Refinement", duration: 1, resource: "Frontend Developer" },
            ],
          },
        ],
      },
      {
        name: "3. Development Phase",
        tasks: [
          {
            name: "3.1 Backend Development",
            duration: 35,
            resource: "Backend Developer",
            subtasks: [
              { name: "API Endpoint Development", duration: 15, resource: "Backend Developer" },
              { name: "Business Logic Implementation", duration: 12, resource: "Backend Developer" },
              { name: "API Testing & Documentation", duration: 5, resource: "Backend Developer" },
              { name: "Performance Optimization", duration: 3, resource: "Backend Developer" },
            ],
          },
          {
            name: "3.2 Database Setup & Management",
            duration: 10,
            resource: "Database Engineer",
            subtasks: [
              { name: "Database Schema Design", duration: 3, resource: "Database Engineer" },
              { name: "Database Implementation", duration: 4, resource: "Database Engineer" },
              { name: "Data Migration Scripts", duration: 2, resource: "Database Engineer" },
              { name: "Database Optimization", duration: 1, resource: "Database Engineer" },
            ],
          },
          {
            name: "3.3 Frontend Development",
            duration: 40,
            resource: "Frontend Developer",
            subtasks: [
              { name: "UI Component Development", duration: 15, resource: "Frontend Developer" },
              { name: "State Management Setup", duration: 5, resource: "Frontend Developer" },
              { name: "API Integration", duration: 10, resource: "Frontend Developer" },
              { name: "Responsive Design Implementation", duration: 7, resource: "Frontend Developer" },
              { name: "Frontend Testing", duration: 3, resource: "Frontend Developer" },
            ],
          },
          {
            name: "3.4 Authentication & Security",
            duration: 12,
            resource: "Backend Developer",
            subtasks: [
              { name: "Authentication System Development", duration: 6, resource: "Backend Developer" },
              { name: "Authorization Implementation", duration: 3, resource: "Backend Developer" },
              { name: "Security Audit & Fixes", duration: 3, resource: "Backend Developer" },
            ],
          },
          {
            name: "3.5 AI Features Integration",
            duration: 20,
            resource: "AI Engineer",
            subtasks: [
              { name: "AI Model Integration", duration: 8, resource: "AI Engineer" },
              { name: "Machine Learning Pipeline", duration: 7, resource: "AI Engineer" },
              { name: "AI Feature Testing", duration: 5, resource: "AI Engineer" },
            ],
          },
        ],
      },
      {
        name: "4. Testing Phase",
        tasks: [
          {
            name: "4.1 Unit Testing",
            duration: 15,
            resource: "QA Engineer",
            subtasks: [
              { name: "Unit Test Development", duration: 8, resource: "QA Engineer" },
              { name: "Code Coverage Analysis", duration: 3, resource: "QA Engineer" },
              { name: "Unit Test Execution", duration: 4, resource: "QA Engineer" },
            ],
          },
          {
            name: "4.2 Integration Testing",
            duration: 12,
            resource: "QA Engineer",
            subtasks: [
              { name: "Integration Test Planning", duration: 2, resource: "QA Engineer" },
              { name: "Integration Test Development", duration: 5, resource: "QA Engineer" },
              { name: "Integration Test Execution", duration: 4, resource: "QA Engineer" },
              { name: "Bug Fixing & Retesting", duration: 1, resource: "QA Engineer" },
            ],
          },
          {
            name: "4.3 User Acceptance Testing (UAT)",
            duration: 8,
            resource: "Project Manager",
            subtasks: [
              { name: "UAT Planning", duration: 1, resource: "Project Manager" },
              { name: "UAT Execution", duration: 5, resource: "Project Manager" },
              { name: "UAT Feedback Collection", duration: 1, resource: "Project Manager" },
              { name: "Final Adjustments", duration: 1, resource: "Project Manager" },
            ],
          },
        ],
      },
      {
        name: "5. Deployment & Launch",
        tasks: [
          {
            name: "5.1 CI/CD Setup",
            duration: 8,
            resource: "DevOps Engineer",
            subtasks: [
              { name: "CI/CD Pipeline Configuration", duration: 4, resource: "DevOps Engineer" },
              { name: "Automated Testing Integration", duration: 2, resource: "DevOps Engineer" },
              { name: "Deployment Automation", duration: 2, resource: "DevOps Engineer" },
            ],
          },
          {
            name: "5.2 Production Deployment",
            duration: 5,
            resource: "DevOps Engineer",
            subtasks: [
              { name: "Production Environment Setup", duration: 2, resource: "DevOps Engineer" },
              { name: "Application Deployment", duration: 2, resource: "DevOps Engineer" },
              { name: "Deployment Verification", duration: 1, resource: "DevOps Engineer" },
            ],
          },
          {
            name: "5.3 Post-Launch Monitoring",
            duration: 10,
            resource: "DevOps Engineer",
            subtasks: [
              { name: "Monitoring Setup", duration: 3, resource: "DevOps Engineer" },
              { name: "Performance Monitoring", duration: 4, resource: "DevOps Engineer" },
              { name: "Issue Resolution", duration: 3, resource: "DevOps Engineer" },
            ],
          },
        ],
      },
    ],
  },
  "e-commerce": {
    phases: [
      {
        name: "1. Project Planning & Analysis",
        tasks: [
          {
            name: "1.1 Project Initiation",
            duration: 3,
            resource: "Project Manager",
            subtasks: [
              { name: "Stakeholder Alignment", duration: 1, resource: "Project Manager" },
              { name: "Project Charter", duration: 1, resource: "Project Manager" },
              { name: "Team Setup", duration: 1, resource: "Project Manager" },
            ],
          },
          {
            name: "1.2 Requirements Analysis",
            duration: 10,
            resource: "Project Manager",
            subtasks: [
              { name: "Business Requirements", duration: 4, resource: "Project Manager" },
              { name: "Functional Requirements", duration: 3, resource: "Project Manager" },
              { name: "Non-Functional Requirements", duration: 2, resource: "Project Manager" },
              { name: "Requirements Validation", duration: 1, resource: "Project Manager" },
            ],
          },
          {
            name: "1.3 Technical Design & Architecture",
            duration: 12,
            resource: "Backend Developer",
            subtasks: [
              { name: "System Architecture Design", duration: 5, resource: "Backend Developer" },
              { name: "Database Schema Design", duration: 3, resource: "Backend Developer" },
              { name: "API Design", duration: 3, resource: "Backend Developer" },
              { name: "Security Architecture", duration: 1, resource: "Backend Developer" },
            ],
          },
        ],
      },
      {
        name: "2. Design Phase",
        tasks: [
          {
            name: "2.1 UI/UX Design",
            duration: 18,
            resource: "UI/UX Designer",
            subtasks: [
              { name: "User Research", duration: 4, resource: "UI/UX Designer" },
              { name: "Information Architecture", duration: 3, resource: "UI/UX Designer" },
              { name: "Wireframing", duration: 5, resource: "UI/UX Designer" },
              { name: "Visual Design", duration: 4, resource: "UI/UX Designer" },
              { name: "Design Review", duration: 2, resource: "UI/UX Designer" },
            ],
          },
          {
            name: "2.2 Product Pages Design",
            duration: 12,
            resource: "UI/UX Designer",
            subtasks: [
              { name: "Product Listing Design", duration: 4, resource: "UI/UX Designer" },
              { name: "Product Detail Page Design", duration: 4, resource: "UI/UX Designer" },
              { name: "Category Pages Design", duration: 3, resource: "UI/UX Designer" },
              { name: "Design Refinement", duration: 1, resource: "UI/UX Designer" },
            ],
          },
        ],
      },
      {
        name: "3. Development Phase",
        tasks: [
          {
            name: "3.1 Database Development",
            duration: 10,
            resource: "Database Engineer",
            subtasks: [
              { name: "Database Implementation", duration: 5, resource: "Database Engineer" },
              { name: "Data Models Creation", duration: 3, resource: "Database Engineer" },
              { name: "Database Optimization", duration: 2, resource: "Database Engineer" },
            ],
          },
          {
            name: "3.2 Product Catalog System",
            duration: 20,
            resource: "Backend Developer",
            subtasks: [
              { name: "Product Management APIs", duration: 8, resource: "Backend Developer" },
              { name: "Category Management", duration: 5, resource: "Backend Developer" },
              { name: "Search & Filter APIs", duration: 5, resource: "Backend Developer" },
              { name: "Catalog Testing", duration: 2, resource: "Backend Developer" },
            ],
          },
          {
            name: "3.3 Shopping Cart & Checkout",
            duration: 15,
            resource: "Frontend Developer",
            subtasks: [
              { name: "Cart Component Development", duration: 5, resource: "Frontend Developer" },
              { name: "Checkout Flow", duration: 6, resource: "Frontend Developer" },
              { name: "Order Management UI", duration: 3, resource: "Frontend Developer" },
              { name: "Cart Testing", duration: 1, resource: "Frontend Developer" },
            ],
          },
          {
            name: "3.4 Payment Gateway Integration",
            duration: 15,
            resource: "Backend Developer",
            subtasks: [
              { name: "Payment API Integration", duration: 8, resource: "Backend Developer" },
              { name: "Payment Security Implementation", duration: 4, resource: "Backend Developer" },
              { name: "Payment Testing", duration: 3, resource: "Backend Developer" },
            ],
          },
          {
            name: "3.5 AI Recommendation Engine",
            duration: 25,
            resource: "AI Engineer",
            subtasks: [
              { name: "ML Model Development", duration: 10, resource: "AI Engineer" },
              { name: "Recommendation Algorithm", duration: 8, resource: "AI Engineer" },
              { name: "Integration with Catalog", duration: 5, resource: "AI Engineer" },
              { name: "AI Testing & Tuning", duration: 2, resource: "AI Engineer" },
            ],
          },
          {
            name: "3.6 Admin Dashboard",
            duration: 20,
            resource: "Frontend Developer",
            subtasks: [
              { name: "Dashboard Layout", duration: 5, resource: "Frontend Developer" },
              { name: "Product Management UI", duration: 6, resource: "Frontend Developer" },
              { name: "Order Management UI", duration: 5, resource: "Frontend Developer" },
              { name: "Analytics Dashboard", duration: 4, resource: "Frontend Developer" },
            ],
          },
        ],
      },
      {
        name: "4. Testing & Quality Assurance",
        tasks: [
          {
            name: "4.1 Comprehensive Testing",
            duration: 18,
            resource: "QA Engineer",
            subtasks: [
              { name: "Test Planning", duration: 2, resource: "QA Engineer" },
              { name: "Functional Testing", duration: 6, resource: "QA Engineer" },
              { name: "Integration Testing", duration: 5, resource: "QA Engineer" },
              { name: "Performance Testing", duration: 3, resource: "QA Engineer" },
              { name: "Security Testing", duration: 2, resource: "QA Engineer" },
            ],
          },
        ],
      },
      {
        name: "5. Deployment & Launch",
        tasks: [
          {
            name: "5.1 Production Deployment",
            duration: 8,
            resource: "DevOps Engineer",
            subtasks: [
              { name: "Production Environment Setup", duration: 3, resource: "DevOps Engineer" },
              { name: "Application Deployment", duration: 3, resource: "DevOps Engineer" },
              { name: "Deployment Verification", duration: 2, resource: "DevOps Engineer" },
            ],
          },
        ],
      },
    ],
  },
  "saas-platform": {
    phases: [
      {
        name: "Planning",
        tasks: [
          { name: "Requirements", duration: 5, resource: "Project Manager" },
          { name: "Architecture", duration: 8, resource: "Backend Developer" },
        ],
      },
      {
        name: "Design",
        tasks: [{ name: "UI Design", duration: 12, resource: "UI/UX Designer" }],
      },
      {
        name: "Development",
        tasks: [
          { name: "Backend APIs", duration: 25, resource: "Backend Developer" },
          { name: "Frontend Dashboard", duration: 30, resource: "Frontend Developer" },
          { name: "Multi-tenancy Setup", duration: 10, resource: "Backend Developer" },
          { name: "AI Analytics", duration: 15, resource: "AI Engineer" },
        ],
      },
      {
        name: "Launch",
        tasks: [
          { name: "Testing", duration: 10, resource: "QA Engineer" },
          { name: "Deployment", duration: 5, resource: "DevOps Engineer" },
        ],
      },
    ],
  },
  "crm-system": {
    phases: [
      {
        name: "Planning",
        tasks: [{ name: "Requirements", duration: 5, resource: "Project Manager" }],
      },
      {
        name: "Development",
        tasks: [
          { name: "Database Design", duration: 8, resource: "Database Engineer" },
          { name: "Contact Management", duration: 15, resource: "Backend Developer" },
          { name: "Sales Pipeline", duration: 20, resource: "Frontend Developer" },
          { name: "AI Lead Scoring", duration: 12, resource: "AI Engineer" },
        ],
      },
      {
        name: "Testing",
        tasks: [{ name: "QA Testing", duration: 10, resource: "QA Engineer" }],
      },
    ],
  },
  "booking-app": {
    phases: [
      {
        name: "Planning",
        tasks: [{ name: "Requirements", duration: 5, resource: "Project Manager" }],
      },
      {
        name: "Development",
        tasks: [
          { name: "Booking Engine", duration: 20, resource: "Backend Developer" },
          { name: "Calendar System", duration: 15, resource: "Frontend Developer" },
          { name: "Payment Integration", duration: 10, resource: "Backend Developer" },
        ],
      },
      {
        name: "Testing",
        tasks: [{ name: "Testing", duration: 8, resource: "QA Engineer" }],
      },
    ],
  },
  "hospital-system": {
    phases: [
      {
        name: "Planning",
        tasks: [
          { name: "Requirements", duration: 8, resource: "Project Manager" },
          { name: "Compliance Review", duration: 5, resource: "Project Manager" },
        ],
      },
      {
        name: "Development",
        tasks: [
          { name: "Patient Records", duration: 20, resource: "Backend Developer" },
          { name: "Appointment System", duration: 15, resource: "Frontend Developer" },
          { name: "AI Diagnosis Assistant", duration: 25, resource: "AI Engineer" },
        ],
      },
      {
        name: "Testing",
        tasks: [{ name: "Testing", duration: 15, resource: "QA Engineer" }],
      },
    ],
  },
  "school-system": {
    phases: [
      {
        name: "Planning",
        tasks: [{ name: "Requirements", duration: 5, resource: "Project Manager" }],
      },
      {
        name: "Development",
        tasks: [
          { name: "Student Management", duration: 18, resource: "Backend Developer" },
          { name: "Grade Management", duration: 15, resource: "Frontend Developer" },
          { name: "Attendance System", duration: 10, resource: "Frontend Developer" },
        ],
      },
      {
        name: "Testing",
        tasks: [{ name: "Testing", duration: 10, resource: "QA Engineer" }],
      },
    ],
  },
  custom: {
    phases: [
      {
        name: "Planning",
        tasks: [{ name: "Requirements", duration: 5, resource: "Project Manager" }],
      },
      {
        name: "Development",
        tasks: [
          { name: "Backend Development", duration: 20, resource: "Backend Developer" },
          { name: "Frontend Development", duration: 20, resource: "Frontend Developer" },
        ],
      },
      {
        name: "Testing",
        tasks: [{ name: "Testing", duration: 8, resource: "QA Engineer" }],
      },
    ],
  },
}

export function generateWBS(type: ProjectType, startDate: Date) {
  const template = templates[type]
  const tasks: Task[] = []
  const resourceMap = new Map<string, Resource>()

  const currentDate = new Date(startDate)
  let totalCost = 0
  const taskIdMap = new Map<string, string>() // Map for dependency tracking

  template.phases.forEach((phase, phaseIndex) => {
    const phaseId = `phase-${phaseIndex}`
    const phaseStartDate = new Date(currentDate)
    let phaseDuration = 0
    let phaseCost = 0
    const phaseTaskIds: string[] = []

    // Create phase-level task (Level 1)
    phase.tasks.forEach((task, taskIndex) => {
      const taskId = `task-${phaseIndex}-${taskIndex}`
      taskIdMap.set(`${phaseIndex}-${taskIndex}`, taskId)

      let taskStartDate = new Date(currentDate)

      // Handle dependencies - find previous task in same phase or previous phase
      const dependencies: string[] = []
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depIndex) => {
          const depId = taskIdMap.get(`${phaseIndex}-${depIndex}`)
          if (depId) dependencies.push(depId)
        })
      } else if (taskIndex > 0) {
        // Auto-dependency: depends on previous task in same phase
        const prevTaskId = taskIdMap.get(`${phaseIndex}-${taskIndex - 1}`)
        if (prevTaskId) {
          dependencies.push(prevTaskId)
          const prevTask = tasks.find(t => t.id === prevTaskId)
          if (prevTask) {
            taskStartDate = new Date(prevTask.endDate)
          }
        }
      } else if (phaseIndex > 0 && taskIndex === 0) {
        // First task of phase depends on last task of previous phase
        const prevPhaseTasks = tasks.filter(t => t.parentId === `phase-${phaseIndex - 1}`)
        if (prevPhaseTasks.length > 0) {
          const lastPrevTask = prevPhaseTasks[prevPhaseTasks.length - 1]
          dependencies.push(lastPrevTask.id)
          taskStartDate = new Date(lastPrevTask.endDate)
        }
      }

      const taskEndDate = new Date(taskStartDate)
      taskEndDate.setDate(taskEndDate.getDate() + task.duration)

      const rate = RESOURCE_RATES[task.resource as keyof typeof RESOURCE_RATES] || 100
      let taskCost = 0 // Will be calculated from subtasks if they exist, otherwise from task duration
      const subtasks: Task[] = []

      // Create subtasks (Level 3) if they exist
      if (task.subtasks && task.subtasks.length > 0) {
        let subtaskStartDate = new Date(taskStartDate)

        task.subtasks.forEach((subtask, subtaskIndex) => {
          const subtaskId = `subtask-${phaseIndex}-${taskIndex}-${subtaskIndex}`
          const subtaskEndDate = new Date(subtaskStartDate)
          subtaskEndDate.setDate(subtaskEndDate.getDate() + subtask.duration)

          const subtaskRate = RESOURCE_RATES[subtask.resource as keyof typeof RESOURCE_RATES] || 100
          const subtaskCost = subtask.duration * 8 * subtaskRate
          taskCost += subtaskCost // Accumulate subtask costs
          totalCost += subtaskCost

          const subtaskDependencies: string[] = []
          if (subtask.dependencies && subtask.dependencies.length > 0) {
            subtask.dependencies.forEach((depIndex) => {
              const depSubtaskId = `subtask-${phaseIndex}-${taskIndex}-${depIndex}`
              if (tasks.find(t => t.id === depSubtaskId)) {
                subtaskDependencies.push(depSubtaskId)
              }
            })
          } else if (subtaskIndex > 0) {
            // Auto-dependency on previous subtask
            const prevSubtaskId = `subtask-${phaseIndex}-${taskIndex}-${subtaskIndex - 1}`
            const prevSubtask = tasks.find(t => t.id === prevSubtaskId)
            if (prevSubtask) {
              subtaskDependencies.push(prevSubtaskId)
              subtaskStartDate = new Date(prevSubtask.endDate)
            }
          }

          subtasks.push({
            id: subtaskId,
            name: subtask.name,
            wbsCode: `${phaseIndex + 1}.${taskIndex + 1}.${subtaskIndex + 1}`,
            level: 3,
            parentId: taskId,
            duration: subtask.duration,
            startDate: subtaskStartDate.toISOString(),
            endDate: subtaskEndDate.toISOString(),
            resource: subtask.resource,
            cost: subtaskCost,
            isCriticalPath: subtaskIndex === 0,
            dependencies: subtaskDependencies,
          })

          // Track resources
          if (!resourceMap.has(subtask.resource)) {
            resourceMap.set(subtask.resource, {
              id: crypto.randomUUID(),
              name: `${subtask.resource} ${resourceMap.size + 1}`,
              role: subtask.resource,
              rate: subtaskRate,
            })
          }

          subtaskStartDate = new Date(subtaskEndDate)
        })

        // Update task end date to match last subtask
        if (subtasks.length > 0) {
          const lastSubtask = subtasks[subtasks.length - 1]
          taskEndDate.setTime(new Date(lastSubtask.endDate).getTime())
        }
      } else {
        // No subtasks - calculate cost from main task
        taskCost = task.duration * 8 * rate
        totalCost += taskCost
      }

      phaseCost += taskCost

      // Calculate actual task duration from dates
      const actualTaskDuration = Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24))
      phaseDuration = Math.max(phaseDuration, Math.ceil((taskEndDate.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24)))

      // Create main task (Level 2)
      const mainTask: Task = {
        id: taskId,
        name: task.name,
        wbsCode: `${phaseIndex + 1}.${taskIndex + 1}`,
        level: 2,
        parentId: phaseId,
        duration: actualTaskDuration, // Use calculated duration
        startDate: taskStartDate.toISOString(),
        endDate: taskEndDate.toISOString(),
        resource: task.resource,
        cost: taskCost,
        isCriticalPath: taskIndex === 0 || dependencies.length > 0,
        dependencies: dependencies,
      }

      tasks.push(mainTask)
      phaseTaskIds.push(taskId)

      // Add subtasks
      if (subtasks.length > 0) {
        tasks.push(...subtasks)
      }

      // Track resources
      if (!resourceMap.has(task.resource)) {
        resourceMap.set(task.resource, {
          id: crypto.randomUUID(),
          name: `${task.resource} ${resourceMap.size + 1}`,
          role: task.resource,
          rate,
        })
      }

      currentDate.setTime(Math.max(currentDate.getTime(), taskEndDate.getTime()))
    })

    const phaseEndDate = new Date(currentDate)

    // Create phase summary task (Level 1)
    tasks.push({
      id: phaseId,
      name: phase.name,
      wbsCode: `${phaseIndex + 1}`,
      level: 1,
      parentId: null,
      duration: phaseDuration,
      startDate: phaseStartDate.toISOString(),
      endDate: phaseEndDate.toISOString(),
      resource: null,
      cost: phaseCost,
      isCriticalPath: true,
      dependencies: phaseIndex > 0 ? [`phase-${phaseIndex - 1}`] : [],
    })
  })

  // Calculate critical path based on dependencies
  const calculateCriticalPath = () => {
    const earlyStart = new Map<string, number>()
    const earlyFinish = new Map<string, number>()

    // Forward pass
    tasks.forEach((task) => {
      let es = 0
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          const depTask = tasks.find(t => t.id === depId)
          if (depTask) {
            const depEF = earlyFinish.get(depId) || 0
            es = Math.max(es, depEF)
          }
        })
      }
      earlyStart.set(task.id, es)
      earlyFinish.set(task.id, es + task.duration)
    })

    const maxFinish = Math.max(...Array.from(earlyFinish.values()))
    const lateFinish = new Map<string, number>()
    const lateStart = new Map<string, number>()

    // Backward pass
    tasks.slice().reverse().forEach((task) => {
      let lf = maxFinish
      const dependents = tasks.filter(t => t.dependencies?.includes(task.id))
      if (dependents.length > 0) {
        dependents.forEach((dep) => {
          const depLS = lateStart.get(dep.id) ?? maxFinish
          lf = Math.min(lf, depLS)
        })
      }
      lateFinish.set(task.id, lf)
      lateStart.set(task.id, lf - task.duration)
    })

    // Mark critical path
    tasks.forEach((task) => {
      const es = earlyStart.get(task.id) || 0
      const ef = earlyFinish.get(task.id) || 0
      const ls = lateStart.get(task.id) || 0
      const lf = lateFinish.get(task.id) || 0
      task.isCriticalPath = (es === ls && ef === lf)
    })
  }

  calculateCriticalPath()

  const totalDuration = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    tasks,
    resources: Array.from(resourceMap.values()),
    duration: totalDuration,
    budget: totalCost,
  }
}
