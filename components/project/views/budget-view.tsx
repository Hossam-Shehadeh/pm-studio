"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Project, Task } from "@/lib/types"
import { DollarSign, TrendingUp, AlertCircle, Edit2, Check, X, PieChart } from "lucide-react"
import { updateProject } from "@/lib/storage"

interface BudgetViewProps {
  project: Project
  onUpdate?: () => void
}

export function BudgetView({ project, onUpdate }: BudgetViewProps) {
  // Calculate comprehensive budget breakdown - consistent with Project Summary
  const laborCost = project.budget
  const contingency = Math.round(laborCost * 0.15) // 15% contingency
  const overhead = Math.round(laborCost * 0.10) // 10% overhead
  const totalBudget = laborCost + contingency + overhead
  
  // Calculate actual task costs to verify consistency
  const actualTaskCosts = project.tasks.reduce((sum, task) => sum + task.cost, 0)

  // Calculate cost by WBS level
  const costByLevel = project.tasks.reduce((acc, task) => {
    const level = task.level
    if (!acc[level]) {
      acc[level] = { count: 0, cost: 0, tasks: [] }
    }
    acc[level].count++
    acc[level].cost += task.cost
    acc[level].tasks.push(task)
    return acc
  }, {} as Record<number, { count: number; cost: number; tasks: Task[] }>)

  const [editingResource, setEditingResource] = useState<string | null>(null)
  const [editRate, setEditRate] = useState(0)

  const startEdit = (resourceId: string, rate: number) => {
    setEditingResource(resourceId)
    setEditRate(rate)
  }

  const saveEdit = (resourceId: string) => {
    const updatedResources = project.resources.map((r) => (r.id === resourceId ? { ...r, rate: editRate } : r))
    // Recalculate budget
    const newBudget = project.tasks.reduce((sum, task) => {
      const resource = updatedResources.find((r) => r.role === task.resource)
      return sum + (resource ? task.duration * 8 * resource.rate : 0)
    }, 0)
    updateProject({ ...project, resources: updatedResources, budget: newBudget })
    setEditingResource(null)
    onUpdate?.()
  }

  const costByPhase = project.tasks
    .filter((t) => t.level === 1)
    .map((phase) => ({
      name: phase.name,
      cost: project.tasks
        .filter((t) => t.parentId === phase.id || t.id === phase.id)
        .reduce((sum, t) => sum + t.cost, 0),
    }))

  // Check if actual task costs match project budget (allow small rounding differences)
  const costDifference = Math.abs(laborCost - actualTaskCosts)
  const hasCostMismatch = costDifference > 1 // More than $1 difference

  return (
    <div className="space-y-6">
      {/* Cost Validation Notice */}
      {hasCostMismatch && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">Budget Calculation Notice</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Project budget (${laborCost.toLocaleString()}) differs from sum of task costs (${actualTaskCosts.toLocaleString()}) by ${costDifference.toLocaleString()}.
                  This may be due to resource rate changes or task updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="gradient-card border-l-4 border-l-chart-3 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Labor Cost</CardTitle>
            <div className="size-10 rounded-xl bg-gradient-to-br from-chart-3 to-warning flex items-center justify-center shadow-lg shadow-chart-3/30">
              <DollarSign className="size-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black bg-gradient-to-r from-chart-3 to-warning bg-clip-text text-transparent">
              ${laborCost.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Based on resource allocation</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-5 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Contingency</CardTitle>
            <div className="size-10 rounded-xl bg-gradient-to-br from-chart-5 to-destructive flex items-center justify-center shadow-lg shadow-chart-5/30">
              <AlertCircle className="size-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black bg-gradient-to-r from-chart-5 to-destructive bg-clip-text text-transparent">
              ${contingency.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">15% buffer for risks</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Total Budget</CardTitle>
            <div className="size-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <TrendingUp className="size-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              ${totalBudget.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Labor + Contingency + Overhead</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="size-5 text-chart-2" />
              Budget Components
            </CardTitle>
            <CardDescription className="text-base">Detailed budget breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-chart-3/10 to-chart-3/5 border border-chart-3/20">
                <span className="font-semibold">Labor Cost</span>
                <span className="font-bold text-lg">${laborCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-chart-5/10 to-chart-5/5 border border-chart-5/20">
                <span className="font-semibold">Contingency (15%)</span>
                <span className="font-bold text-lg">${contingency.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-chart-4/10 to-chart-4/5 border border-chart-4/20">
                <span className="font-semibold">Overhead (10%)</span>
                <span className="font-bold text-lg">${overhead.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30">
                <span className="font-bold text-lg">Total Project Budget</span>
                <span className="font-black text-2xl bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                  ${totalBudget.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <PieChart className="size-5 text-chart-1" />
              Cost by WBS Level
            </CardTitle>
            <CardDescription className="text-base">Budget distribution by hierarchy level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(costByLevel)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, data]) => {
                  const percentage = Math.round((data.cost / laborCost) * 100)
                  const levelNames = ["Phase", "Task", "Subtask", "Work Package"]
                  const levelName = levelNames[Number(level) - 1] || `Level ${level}`
                  const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
                  const color = colors[(Number(level) - 1) % colors.length]

                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {levelName} Level ({data.count} items)
                        </span>
                        <span className="font-bold text-lg">${data.cost.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full bg-gradient-to-r from-${color} to-${color}/80 rounded-full shadow-lg transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="size-5 text-chart-1" />
            <CardTitle className="text-xl">Cost Breakdown by Phase</CardTitle>
          </div>
          <CardDescription className="text-base">Budget distribution across project phases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {costByPhase.map((phase, i) => {
              const percentage = Math.round((phase.cost / laborCost) * 100)
              const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
              const color = colors[i % colors.length]

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{phase.name}</span>
                    <span className={`font-bold text-lg bg-gradient-to-r from-${color} to-primary bg-clip-text text-transparent`}>
                      ${phase.cost.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full bg-gradient-to-r from-${color} to-${color}/80 rounded-full shadow-lg transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-l-4 border-l-chart-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Resource Cost Breakdown</CardTitle>
          <CardDescription className="text-base">Labor costs by resource type (click to edit rates)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.resources.map((resource, index) => {
              const tasks = project.tasks.filter((t) => t.resource === resource.role)
              const hours = tasks.reduce((sum, t) => sum + t.duration * 8, 0)
              const cost = hours * resource.rate
              const isEditing = editingResource === resource.id
              const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
              const color = colors[index % colors.length]

              return (
                <div
                  key={resource.id}
                  className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-${color}/10 to-${color}/5 border border-${color}/20 hover:border-${color}/40 transition-all group`}
                >
                  <div>
                    <div className="font-bold text-lg">{resource.name}</div>
                    <div className="text-sm text-muted-foreground font-medium">{resource.role}</div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-black text-xl bg-gradient-to-r from-${color} to-primary bg-clip-text text-transparent">
                        ${cost.toLocaleString()}
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            value={editRate}
                            onChange={(e) => setEditRate(Number.parseInt(e.target.value) || 0)}
                            className="w-20 h-7 text-xs"
                          />
                          <span className="text-xs">/h</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-success"
                            onClick={() => saveEdit(resource.id)}
                          >
                            <Check className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-destructive"
                            onClick={() => setEditingResource(null)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                          {hours}h × ${resource.rate}/h
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                            onClick={() => startEdit(resource.id, resource.rate)}
                          >
                            <Edit2 className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
