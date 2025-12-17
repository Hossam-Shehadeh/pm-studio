"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getProjectById, getProjects } from "@/lib/storage"
import type { Project } from "@/lib/types"
import { MSProjectView } from "@/components/ms-project/ms-project-view"

export default function MSProjectProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadedProjects = getProjects()
    setProjects(loadedProjects)

    const loadedProject = getProjectById(id)
    if (!loadedProject) {
      // If project not found, redirect to MS Project main page
      router.push("/ms-project")
      return
    }
    setProject(loadedProject)
    setIsLoading(false)
  }, [id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading Microsoft Project...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <MSProjectView
        projects={projects}
        selectedProject={project}
        onProjectChange={(newProject) => {
          router.push(`/ms-project/${newProject.id}`)
        }}
      />
    </div>
  )
}

