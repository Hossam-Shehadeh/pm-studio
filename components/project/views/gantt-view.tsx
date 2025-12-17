"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2, ZoomIn, ZoomOut, BarChart3 } from "lucide-react"
import type { Project } from "@/lib/types"
import { useState, useMemo } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"

interface GanttViewProps {
  project: Project
}

export function GanttView({ project }: GanttViewProps) {
  const startDate = new Date(project.startDate)
  const totalDays = project.duration
  const [daysToShow, setDaysToShow] = useState(Math.min(totalDays, 60))
  const [isFullView, setIsFullView] = useState(false)
  const [showWorkChart, setShowWorkChart] = useState(true)

  const zoomIn = () => setDaysToShow(Math.max(30, daysToShow - 10))
  const zoomOut = () => setDaysToShow(Math.min(totalDays, daysToShow + 10))

  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return date
  })

  // Calculate work distribution data for the chart
  const workChartData = useMemo(() => {
    const data: Array<{ date: string; workHours: number; tasks: number; cost: number }> = []

    for (let i = 0; i < Math.min(daysToShow, totalDays); i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Find tasks active on this date
      const activeTasks = project.tasks.filter((task) => {
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)
        return date >= taskStart && date <= taskEnd
      })

      const workHours = activeTasks.reduce((sum, task) => {
        // Assuming 8 hours per day per task
        return sum + 8
      }, 0)

      const cost = activeTasks.reduce((sum, task) => {
        // Daily cost = task cost / task duration
        return sum + (task.cost / task.duration)
      }, 0)

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        workHours,
        tasks: activeTasks.length,
        cost: Math.round(cost),
      })
    }

    return data
  }, [project.tasks, startDate, daysToShow, totalDays])

  // Get tasks to display based on view mode
  const tasksToDisplay = isFullView
    ? project.tasks
    : project.tasks.filter((t) => t.level <= 2)

  // Calculate schedule statistics
  const scheduleStats = useMemo(() => {
    const allTasks = project.tasks.filter(t => t.level <= 2)
    const startDates = allTasks.map(t => new Date(t.startDate))
    const endDates = allTasks.map(t => new Date(t.endDate))
    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())))
    const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())))
    const totalDuration = Math.ceil((latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24))
    const criticalTasks = allTasks.filter(t => t.isCriticalPath)
    const totalWorkDays = allTasks.reduce((sum, t) => sum + t.duration, 0)

    return {
      earliestStart,
      latestEnd,
      totalDuration,
      criticalTasks: criticalTasks.length,
      totalTasks: allTasks.length,
      totalWorkDays,
    }
  }, [project.tasks])

  return (
    <div className="space-y-6">
      {/* Schedule Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Project Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {scheduleStats.earliestStart.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Project End</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {scheduleStats.latestEnd.toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-l-4 border-l-chart-3 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {scheduleStats.totalDuration} days
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round(scheduleStats.totalDuration / 7)} weeks
            </div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-l-4 border-l-chart-4 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Critical Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {scheduleStats.criticalTasks} / {scheduleStats.totalTasks}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((scheduleStats.criticalTasks / scheduleStats.totalTasks) * 100)}% critical
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Path Explanation */}
      <Card className="gradient-card border-l-4 border-l-destructive shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive animate-pulse" />
            What is the Critical Path?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The <strong className="text-destructive">Critical Path</strong> is the longest sequence of dependent tasks in your project that directly determines the project finish date.
          </p>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm font-semibold text-destructive mb-2">
              🔴 If any task on the critical path is delayed → the entire project is delayed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Concepts:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Critical Task:</strong> A task with zero slack (float)</li>
                <li><strong>Slack / Float:</strong> How much a task can be delayed without affecting the project end date</li>
                <li><strong>Critical Path:</strong> Tasks with 0 slack</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Example:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Design (5 days)</li>
                <li>Development (10 days) → depends on Design</li>
                <li>Testing (4 days) → depends on Development</li>
                <li className="font-semibold text-foreground mt-2">➡️ Total = 19 days (Critical Path)</li>
                <li className="text-xs text-muted-foreground">If "Development" is delayed by 2 days → project finishes in 21 days</li>
              </ul>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Microsoft Project automatically calculates the critical path based on task durations, dependencies (Finish-to-Start, etc.), start date, calendars, and constraints. You must have task links (dependencies) for a real critical path.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span className="size-2 rounded-full bg-gradient-to-r from-chart-2 to-info animate-pulse" />
                Schedule Timetable (Gantt Chart)
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Visual timeline of project tasks, dependencies, and schedule
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <ZoomOut className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullView(!isFullView)}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                {isFullView ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                {isFullView ? "Compact View" : "Full View"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWorkChart(!showWorkChart)}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                <BarChart3 className="size-4" />
                {showWorkChart ? "Hide Chart" : "Show Chart"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <div className="min-w-max">
              <div className="flex border-b-2 border-primary/20 bg-gradient-to-r from-muted/50 to-muted/30">
                <div className="w-72 p-4 font-bold sticky left-0 bg-gradient-to-r from-card to-muted/50 border-r-2 border-primary/20">
                  Task Name
                </div>
                <div className="flex">
                  {dates.map((date, i) => (
                    <div
                      key={i}
                      className={`w-10 p-2 text-xs text-center font-semibold border-r border-border ${date.getDay() === 0 || date.getDay() === 6 ? "bg-muted/40" : ""
                        }`}
                    >
                      <div>{date.getDate()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {date.toLocaleDateString("en", { weekday: "short" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {tasksToDisplay.map((task, index) => {
                const taskStart = Math.floor(
                  (new Date(task.startDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                )
                const taskWidth = task.duration

                const colorMap: Record<string, string> = {
                  "chart-1": "from-chart-1 to-chart-1/80",
                  "chart-2": "from-chart-2 to-chart-2/80",
                  "chart-3": "from-chart-3 to-chart-3/80",
                  "chart-4": "from-chart-4 to-chart-4/80",
                  "chart-5": "from-chart-5 to-chart-5/80",
                }
                const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
                const barColor = colors[index % colors.length]
                const barColorClass = colorMap[barColor] || colorMap["chart-1"]

                return (
                  <div
                    key={task.id}
                    className="flex border-b border-border hover:bg-gradient-to-r hover:from-primary/5 hover:to-chart-1/5 transition-all group"
                  >
                    <div className="w-72 p-4 sticky left-0 bg-card border-r border-border group-hover:bg-gradient-to-r group-hover:from-card group-hover:to-muted/30">
                      <div className="font-semibold text-sm truncate">{task.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
                        <span className="font-mono">{task.wbsCode}</span>
                        <span>•</span>
                        <span>{task.duration} days</span>
                        {task.resource && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {task.resource}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex relative">
                      {dates.map((date, i) => (
                        <div
                          key={i}
                          className={`w-10 border-r border-border ${date.getDay() === 0 || date.getDay() === 6 ? "bg-muted/20" : ""
                            }`}
                        />
                      ))}
                      <div
                        className={`absolute top-3 h-8 rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-r ${barColorClass} hover:shadow-xl transition-all cursor-pointer group/task`}
                        style={{
                          left: `${taskStart * 40}px`,
                          width: `${Math.min(taskWidth * 40, (daysToShow - taskStart) * 40)}px`,
                          minWidth: "40px",
                        }}
                        title={`${task.name} - ${task.duration} days - ${task.resource || "No resource"}`}
                      >
                        <div className="text-xs font-bold text-white opacity-0 group-hover/task:opacity-100 transition-opacity px-2 truncate">
                          {task.duration}d
                        </div>
                        {task.isCriticalPath && (
                          <Badge variant="destructive" className="text-xs h-5 font-bold shadow-lg absolute -top-2 -right-2">
                            Critical
                          </Badge>
                        )}
                      </div>
                      {/* Show dependency arrows */}
                      {task.dependencies && task.dependencies.length > 0 && (
                        task.dependencies.map((depId) => {
                          const depTask = tasksToDisplay.find(t => t.id === depId)
                          if (!depTask) return null
                          const depStart = Math.floor(
                            (new Date(depTask.startDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                          )
                          const depEnd = depStart + depTask.duration
                          const currentStart = taskStart

                          return (
                            <svg
                              key={depId}
                              className="absolute pointer-events-none"
                              style={{
                                left: `${depEnd * 40}px`,
                                top: "20px",
                                width: `${(currentStart - depEnd) * 40}px`,
                                height: "20px",
                                zIndex: 1,
                              }}
                            >
                              <line
                                x1="0"
                                y1="10"
                                x2="100%"
                                y2="10"
                                stroke={task.isCriticalPath ? "#ef4444" : "#64748b"}
                                strokeWidth="2"
                                strokeDasharray={task.isCriticalPath ? "0" : "3,3"}
                                markerEnd="url(#arrowhead)"
                              />
                              <defs>
                                <marker
                                  id="arrowhead"
                                  markerWidth="10"
                                  markerHeight="10"
                                  refX="9"
                                  refY="3"
                                  orient="auto"
                                >
                                  <polygon points="0 0, 10 3, 0 6" fill={task.isCriticalPath ? "#ef4444" : "#64748b"} />
                                </marker>
                              </defs>
                            </svg>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border">
            <span className="text-sm font-semibold text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-chart-1 to-chart-1/80" />
              <span className="text-sm">Normal Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive" />
              <span className="text-sm">Critical Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-sm">Weekend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showWorkChart && (
        <div className="space-y-6 mt-6">
          <Card className="gradient-card border-l-4 border-l-chart-3 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="size-5 text-chart-3" />
                Work Distribution Chart
              </CardTitle>
              <CardDescription className="text-base">
                Daily work hours, active tasks, and cost distribution over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  workHours: {
                    label: "Work Hours",
                    color: "hsl(var(--chart-2))",
                  },
                  tasks: {
                    label: "Active Tasks",
                    color: "hsl(var(--chart-1))",
                  },
                  cost: {
                    label: "Daily Cost",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="workHours"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.2}
                      name="Work Hours"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="tasks"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                      name="Active Tasks"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-3))", r: 3 }}
                      name="Daily Cost ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="gradient-card border-l-4 border-l-chart-4 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Resource Workload</CardTitle>
              <CardDescription>Total work hours by resource</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={project.resources.reduce((acc, resource, index) => {
                  const colors = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
                  acc[resource.role] = {
                    label: resource.role,
                    color: `hsl(var(--${colors[index % colors.length]}))`,
                  }
                  return acc
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={project.resources.map((resource) => {
                      const resourceTasks = project.tasks.filter((t) => t.resource === resource.role)
                      const totalHours = resourceTasks.reduce((sum, task) => sum + task.duration * 8, 0)
                      return {
                        resource: resource.role,
                        hours: totalHours,
                      }
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="resource"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="hours" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
