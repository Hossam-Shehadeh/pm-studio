import { Suspense } from "react"
import Link from "next/link"
import { ProjectsList } from "@/components/dashboard/projects-list"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage and create AI-powered project plans</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ms-project">
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Microsoft Project View
              </Button>
            </Link>
            <CreateProjectDialog />
          </div>
        </div>
        <Suspense fallback={<div>Loading projects...</div>}>
          <ProjectsList />
        </Suspense>
      </main>
    </div>
  )
}
