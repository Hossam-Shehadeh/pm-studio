"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Edit2, Check, X } from "lucide-react"
import type { Project } from "@/lib/types"
import { updateProject } from "@/lib/storage"

interface ResourcesViewProps {
  project: Project
  onUpdate?: () => void
}

export function ResourcesView({ project, onUpdate }: ResourcesViewProps) {
  const [editingResource, setEditingResource] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; rate: number }>({ name: "", rate: 0 })

  const startEdit = (resourceId: string, name: string, rate: number) => {
    setEditingResource(resourceId)
    setEditValues({ name, rate })
  }

  const saveEdit = (resourceId: string) => {
    const updatedResources = project.resources.map((r) =>
      r.id === resourceId ? { ...r, name: editValues.name, rate: editValues.rate } : r,
    )
    updateProject({ ...project, resources: updatedResources })
    setEditingResource(null)
    onUpdate?.()
  }

  const cancelEdit = () => {
    setEditingResource(null)
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-l-4 border-l-chart-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <span className="size-2 rounded-full bg-gradient-to-r from-chart-4 to-success animate-pulse" />
            Resource Allocation
          </CardTitle>
          <CardDescription className="text-base">
            Team members and workload distribution (click to edit)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {project.resources.map((resource) => {
              const assignedTasks = project.tasks.filter((t) => t.resource === resource.role)
              const totalHours = assignedTasks.reduce((sum, t) => sum + t.duration * 8, 0)
              const utilization = Math.min(Math.round((totalHours / (project.duration * 8)) * 100), 100)
              const isEditing = editingResource === resource.id

              const getUtilizationColor = (util: number) => {
                if (util >= 90) return "from-destructive to-chart-5"
                if (util >= 70) return "from-chart-3 to-warning"
                return "from-chart-4 to-success"
              }

              return (
                <div
                  key={resource.id}
                  className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-background to-muted/30 border border-border hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 border-2 border-primary/20">
                      <AvatarFallback
                        className={`text-white font-bold bg-gradient-to-br ${getUtilizationColor(utilization)}`}
                      >
                        {resource.role.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="h-8"
                          />
                          <Input
                            type="number"
                            value={editValues.rate}
                            onChange={(e) =>
                              setEditValues({ ...editValues, rate: Number.parseInt(e.target.value) || 0 })
                            }
                            className="w-24 h-8"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-success"
                            onClick={() => saveEdit(resource.id)}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={cancelEdit}>
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{resource.name}</span>
                            <Badge className="bg-gradient-to-r from-chart-1 to-chart-5 text-white border-0">
                              {resource.role}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                              onClick={() => startEdit(resource.id, resource.name, resource.rate)}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">
                            ${resource.rate}/hr • {assignedTasks.length} tasks • {totalHours}h total
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-black bg-gradient-to-r ${getUtilizationColor(utilization)} bg-clip-text text-transparent`}
                      >
                        {utilization}%
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">Utilization</div>
                    </div>
                  </div>
                  <Progress
                    value={utilization}
                    className={`h-3 [&>div]:bg-gradient-to-r [&>div]:${getUtilizationColor(utilization)}`}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Resource Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-chart-2/10 to-info/10">
              <span className="text-muted-foreground font-medium">Total Resources</span>
              <span className="font-black text-xl bg-gradient-to-r from-chart-2 to-info bg-clip-text text-transparent">
                {project.resources.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-chart-4/10 to-success/10">
              <span className="text-muted-foreground font-medium">Avg Utilization</span>
              <span className="font-black text-xl bg-gradient-to-r from-chart-4 to-success bg-clip-text text-transparent">
                {Math.round(
                  project.resources.reduce((sum, r) => {
                    const tasks = project.tasks.filter((t) => t.resource === r.role)
                    const hours = tasks.reduce((s, t) => s + t.duration * 8, 0)
                    return sum + Math.min((hours / (project.duration * 8)) * 100, 100)
                  }, 0) / project.resources.length,
                )}
                %
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-chart-3/10 to-warning/10">
              <span className="text-muted-foreground font-medium">Total Labor Cost</span>
              <span className="font-black text-xl bg-gradient-to-r from-chart-3 to-warning bg-clip-text text-transparent">
                ${project.budget.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-5 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(project.resources.map((r) => r.role))).map((role, index) => {
                const count = project.resources.filter((r) => r.role === role).length
                const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
                const color = colors[index % colors.length]
                return (
                  <div
                    key={role}
                    className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-${color}/10 to-${color}/5 border border-${color}/20`}
                  >
                    <span className="text-sm font-semibold">{role}</span>
                    <Badge className={`bg-gradient-to-r from-${color} to-primary text-white border-0 text-base px-3`}>
                      {count}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
