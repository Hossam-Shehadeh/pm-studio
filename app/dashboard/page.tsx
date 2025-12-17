import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectsList } from "@/components/dashboard/projects-list"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and create AI-powered project plans</p>
          </div>
          <CreateProjectDialog />
        </div>
        <Suspense fallback={<div>Loading projects...</div>}>
          <ProjectsList />
        </Suspense>
      </main>
    </div>
  )
}
