"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Calendar, DollarSign, Clock, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"
import { getProjects, deleteProject } from "@/lib/storage"
import type { Project } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(getProjects())
  }, [])

  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(projectId)
      setProjects(getProjects())
    }
  }

  if (projects.length === 0) {
    return (
      <Card className="text-center py-16 gradient-card border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl">No Projects Yet</CardTitle>
          <CardDescription className="text-lg">
            Create your first AI-powered project plan to get started
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-chart-4 to-success text-white border-0"
      case "planning":
        return "bg-gradient-to-r from-chart-2 to-info text-white border-0"
      case "completed":
        return "bg-gradient-to-r from-chart-1 to-chart-5 text-white border-0"
      default:
        return ""
    }
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => {
        const chartColor = `chart-${(index % 5) + 1}` as const
        return (
          <Link key={project.id} href={`/project/${project.id}`}>
            <Card
              className={`gradient-card border-l-4 border-l-${chartColor} hover:shadow-2xl hover:shadow-${chartColor}/20 transition-all cursor-pointer group`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="line-clamp-1 text-xl group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 text-base">{project.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" size="icon" className="shrink-0 hover:bg-primary/10">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Edit2 className="size-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onClick={(e) => handleDelete(project.id, e as any)}
                      >
                        <Trash2 className="size-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  <Badge variant="outline" className="border-primary/30">
                    {project.type}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-4 text-chart-2" />
                    <span className="font-medium">{project.duration} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="size-4 text-chart-3" />
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="size-4 text-chart-1" />
                    <span className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
