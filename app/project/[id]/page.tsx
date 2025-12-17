"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProjectHeader } from "@/components/project/project-header"
import { ProjectTabs } from "@/components/project/project-tabs"
import { getProjectById } from "@/lib/storage"
import type { Project } from "@/lib/types"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProject = () => {
    const loadedProject = getProjectById(id)
    if (!loadedProject) {
      router.push("/dashboard")
      return
    }
    setProject(loadedProject)
    setIsLoading(false)
  }

  useEffect(() => {
    loadProject()
  }, [id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading project...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectHeader project={project} />
      <ProjectTabs project={project} onUpdate={loadProject} />
    </div>
  )
}
