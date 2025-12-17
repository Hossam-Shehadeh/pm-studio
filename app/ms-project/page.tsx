"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getProjects } from "@/lib/storage"
import type { Project } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, Home } from "lucide-react"

export default function MSProjectPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadedProjects = getProjects()
    setProjects(loadedProjects)
    setIsLoading(false)

    // If only one project, redirect to it
    if (loadedProjects.length === 1) {
      router.push(`/ms-project/${loadedProjects[0].id}`)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading Microsoft Project...</div>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">No Projects Found</h1>
          <p className="text-muted-foreground">Create a project first to use Microsoft Project view</p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Microsoft Project</h1>
            <p className="text-gray-600">Select a project to view in Microsoft Project format</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="size-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/ms-project/${project.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FolderKanban className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span className="font-semibold">{project.tasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold">{project.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-semibold capitalize ${project.status === "active" ? "text-green-600" :
                          project.status === "completed" ? "text-blue-600" :
                            "text-gray-600"
                        }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                    Open in MS Project
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

