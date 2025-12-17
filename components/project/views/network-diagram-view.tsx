"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Network, RefreshCw } from "lucide-react"
import type { Project, Task, Dependency } from "@/lib/types"
import { useState, useMemo, useEffect } from "react"
import { NetworkDiagramService } from "@/lib/network-diagram-service"
import { validateCriticalPath } from "@/lib/critical-path-validator"
import { updateProject } from "@/lib/storage"

interface NetworkDiagramViewProps {
  project: Project
}

interface Node {
  id: string
  task: Task
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  from: string
  to: string
  dependency: Dependency
  fromNode: Node
  toNode: Node
}

/**
 * MS Project-style Network Diagram View
 * Displays tasks as boxes with ES, EF, LS, LF, Duration, Float
 */
export function NetworkDiagramView({ project }: NetworkDiagramViewProps) {
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showFloat, setShowFloat] = useState(true)
  const [showDates, setShowDates] = useState(true)

  // Calculate critical path using NetworkDiagramService
  const networkResult = useMemo(() => {
    return NetworkDiagramService.calculateCriticalPath(project)
  }, [project.tasks, project.dependencies])

  // Validate critical path calculations
  const validationResult = useMemo(() => {
    return validateCriticalPath(project)
  }, [project.tasks, project.dependencies])

  // Update project when calculations are valid
  useEffect(() => {
    if (networkResult.isValid) {
      const updated = NetworkDiagramService.updateTaskDates(project)
      if (JSON.stringify(updated) !== JSON.stringify(project)) {
        updateProject(updated)
      }
    }
  }, [networkResult.isValid])

  // Calculate network diagram layout - MS Project style
  const { nodes, edges, criticalTasks, scheduleData } = useMemo(() => {
    if (!networkResult.isValid) {
      return { nodes: [], edges: [], criticalTasks: new Set<string>(), scheduleData: new Map() }
    }

    const taskMap = new Map<string, Task>()
    project.tasks.forEach((task) => {
      taskMap.set(task.id, task)
    })

    // Build edges from dependencies
    const edgeList: Edge[] = []

    // Add edges from project dependencies
    project.dependencies?.forEach(dep => {
      const fromTask = taskMap.get(dep.fromTaskId)
      const toTask = taskMap.get(dep.toTaskId)
      if (fromTask && toTask) {
        edgeList.push({
          from: dep.fromTaskId,
          to: dep.toTaskId,
          dependency: dep,
          fromNode: { id: dep.fromTaskId, task: fromTask, x: 0, y: 0, width: 0, height: 0 },
          toNode: { id: dep.toTaskId, task: toTask, x: 0, y: 0, width: 0, height: 0 },
        })
      }
    })

    // Add edges from task dependencies (if not already in project dependencies)
    project.tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          if (!edgeList.some(e => e.from === depId && e.to === task.id)) {
            const fromTask = taskMap.get(depId)
            if (fromTask) {
              edgeList.push({
                from: depId,
                to: task.id,
                dependency: {
                  id: `dep-${depId}-${task.id}`,
                  fromTaskId: depId,
                  toTaskId: task.id,
                  type: "finishToStart",
                  lagDays: 0
                },
                fromNode: { id: depId, task: fromTask, x: 0, y: 0, width: 0, height: 0 },
                toNode: { id: task.id, task, x: 0, y: 0, width: 0, height: 0 },
              })
            }
          }
        })
      }
    })

    // Layout algorithm: Position nodes based on early start (horizontal) and topological level (vertical)
    const scheduleData = networkResult.scheduleData
    const criticalTasks = new Set(networkResult.criticalPath)

    // Group tasks by early start (rounded to nearest day for grouping)
    const timeGroups = new Map<number, string[]>()
    project.tasks.forEach(task => {
      const es = scheduleData.get(task.id)?.earlyStart || 0
      const timeGroup = Math.floor(es / 5) * 5 // Group by 5-day intervals
      if (!timeGroups.has(timeGroup)) {
        timeGroups.set(timeGroup, [])
      }
      timeGroups.get(timeGroup)!.push(task.id)
    })

    // Calculate vertical levels using topological sort
    const levels = new Map<string, number>()
    const visited = new Set<string>()

    const assignLevel = (taskId: string, level: number) => {
      if (visited.has(taskId)) {
        levels.set(taskId, Math.max(levels.get(taskId) || 0, level))
        return
      }
      visited.add(taskId)
      levels.set(taskId, level)

      const successors = NetworkDiagramService.getSuccessors(taskId, project)
      successors.forEach(succId => {
        assignLevel(succId, level + 1)
      })
    }

    // Start with tasks that have no predecessors
    const startTasks = project.tasks.filter(t => {
      const preds = NetworkDiagramService.getPredecessors(t.id, project)
      return preds.length === 0
    })

    startTasks.forEach(task => assignLevel(task.id, 0))

    // Position nodes
    const nodeWidth = 180
    const nodeHeight = 100
    const horizontalSpacing = 250
    const verticalSpacing = 150
    const nodes: Node[] = []

    // Group by level, then by time
    const levelGroups = new Map<number, string[]>()
    levels.forEach((level, taskId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, [])
      }
      levelGroups.get(level)!.push(taskId)
    })

    Array.from(levelGroups.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([level, taskIds]) => {
        // Sort by early start within level
        taskIds.sort((a, b) => {
          const esA = scheduleData.get(a)?.earlyStart || 0
          const esB = scheduleData.get(b)?.earlyStart || 0
          return esA - esB
        })

        const tasksInLevel = taskIds.length
        const totalWidth = tasksInLevel * horizontalSpacing
        const startX = -totalWidth / 2 + horizontalSpacing / 2

        taskIds.forEach((taskId, index) => {
          const task = taskMap.get(taskId)!
          const x = startX + index * horizontalSpacing
          const y = level * verticalSpacing

          nodes.push({
            id: taskId,
            task,
            x,
            y,
            width: nodeWidth,
            height: nodeHeight,
          })
        })
      })

    // Update edge nodes
    edgeList.forEach(edge => {
      edge.fromNode = nodes.find(n => n.id === edge.from) || edge.fromNode
      edge.toNode = nodes.find(n => n.id === edge.to) || edge.toNode
    })

    return {
      nodes,
      edges: edgeList,
      criticalTasks,
      scheduleData
    }
  }, [project.tasks, project.dependencies, networkResult])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const zoomIn = () => setZoom(Math.min(3, zoom + 0.2))
  const zoomOut = () => setZoom(Math.max(0.5, zoom - 0.2))
  const resetView = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  // Calculate viewport bounds
  const minX = nodes.length > 0 ? Math.min(...nodes.map((n) => n.x)) - 200 : -500
  const maxX = nodes.length > 0 ? Math.max(...nodes.map((n) => n.x + n.width)) + 200 : 500
  const minY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.y)) - 200 : -500
  const maxY = nodes.length > 0 ? Math.max(...nodes.map((n) => n.y + n.height)) + 200 : 500
  const viewBoxWidth = maxX - minX || 1000
  const viewBoxHeight = maxY - minY || 1000

  const formatDate = (days: number) => {
    const date = new Date(project.startDate)
    date.setDate(date.getDate() + days)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <Card className="gradient-card border-l-4 border-l-chart-3 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Network className="size-6 text-chart-3" />
                Network Diagram (MS Project Style)
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Precedence Diagramming Method (PDM) with critical path analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFloat(!showFloat)}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                {showFloat ? "Hide" : "Show"} Float
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDates(!showDates)}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                {showDates ? "Hide" : "Show"} Dates
              </Button>
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
                onClick={resetView}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!networkResult.isValid || !validationResult.isValid) && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive font-semibold">Validation Errors:</p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                {networkResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {validationResult.errors.map((error, i) => (
                  <li key={`val-${i}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
              <p className="text-yellow-700 font-semibold">Validation Warnings:</p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {networkResult.isValid && validationResult.isValid && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
              <p className="text-green-700 font-semibold">✓ Critical Path Validated</p>
              <div className="mt-2 text-sm text-green-700">
                <div>Project Duration: {validationResult.details.projectDuration} days</div>
                <div>Critical Tasks: {validationResult.details.tasksOnCriticalPath}</div>
                <div>Tasks with Float: {validationResult.details.tasksWithFloat}</div>
              </div>
            </div>
          )}

          <div
            className={`relative border-2 border-dashed border-border rounded-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden ${isFullScreen ? "h-[800px]" : "h-[600px]"
              }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
                </marker>
                <marker
                  id="arrowhead-critical"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                </marker>
              </defs>

              {/* Draw edges (dependencies) */}
              {edges.map((edge, index) => {
                if (!edge.fromNode || !edge.toNode || edge.fromNode.x === 0 || edge.toNode.x === 0) return null

                const fromX = edge.fromNode.x + edge.fromNode.width
                const fromY = edge.fromNode.y + edge.fromNode.height / 2
                const toX = edge.toNode.x
                const toY = edge.toNode.y + edge.toNode.height / 2

                const isCritical =
                  criticalTasks.has(edge.from) && criticalTasks.has(edge.to)

                // Calculate curved path
                const midX = (fromX + toX) / 2
                const controlPoint1X = fromX + (toX - fromX) * 0.5
                const controlPoint1Y = fromY
                const controlPoint2X = toX - (toX - fromX) * 0.5
                const controlPoint2Y = toY

                return (
                  <g key={`edge-${index}`}>
                    <path
                      d={`M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`}
                      fill="none"
                      stroke={isCritical ? "#ef4444" : "#64748b"}
                      strokeWidth={isCritical ? 3 : 2}
                      strokeDasharray={isCritical ? "0" : "5,5"}
                      markerEnd={isCritical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
                      opacity={0.7}
                    />
                    {/* Lag/Lead indicator */}
                    {edge.dependency.lagDays !== 0 && (
                      <text
                        x={midX}
                        y={(fromY + toY) / 2 - 10}
                        textAnchor="middle"
                        className="text-xs fill-muted-foreground"
                        style={{ fontSize: "10px" }}
                      >
                        {edge.dependency.lagDays > 0 ? `+${edge.dependency.lagDays}d` : `${edge.dependency.lagDays}d`}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Draw nodes (tasks) - MS Project style boxes */}
              {nodes.map((node) => {
                const isCritical = criticalTasks.has(node.id)
                const schedule = scheduleData.get(node.id)
                const isMilestone = node.task.isMilestone || node.task.duration === 0
                const isSummary = node.task.isSummary || project.tasks.some(t => t.parentId === node.id)

                // MS Project box layout
                return (
                  <g key={node.id} className="cursor-pointer">
                    {/* Task box - MS Project style */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx="4"
                      fill={isCritical ? "#fee2e2" : isSummary ? "#e0e7ff" : "#ffffff"}
                      stroke={isCritical ? "#ef4444" : isSummary ? "#6366f1" : "#cbd5e1"}
                      strokeWidth={isCritical ? 3 : isSummary ? 2 : 2}
                      className="transition-all hover:shadow-xl"
                      style={{
                        filter: isCritical ? "drop-shadow(0 4px 6px rgba(239, 68, 68, 0.3))" : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
                      }}
                    />

                    {/* Milestone indicator (diamond shape) - MS Project style */}
                    {isMilestone && (
                      <polygon
                        points={`${node.x + node.width / 2},${node.y + 5} ${node.x + node.width - 5},${node.y + node.height / 2} ${node.x + node.width / 2},${node.y + node.height - 5} ${node.x + 5},${node.y + node.height / 2}`}
                        fill={isCritical ? "#ef4444" : "#6366f1"}
                        stroke={isCritical ? "#dc2626" : "#4f46e5"}
                        strokeWidth={2}
                      />
                    )}

                    {/* MS Project Box Layout */}
                    {/* Top section: ID and Name */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={25}
                      fill={isCritical ? "#fee2e2" : "#f8fafc"}
                      stroke="none"
                    />
                    <line
                      x1={node.x}
                      y1={node.y + 25}
                      x2={node.x + node.width}
                      y2={node.y + 25}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />

                    {/* Task ID - Top Left */}
                    <text
                      x={node.x + 5}
                      y={node.y + 15}
                      className="text-xs font-bold fill-foreground"
                      style={{ fontSize: "10px" }}
                    >
                      {node.task.wbsCode}
                    </text>

                    {/* Task Name - Top Center */}
                    <text
                      x={node.x + node.width / 2}
                      y={node.y + 15}
                      textAnchor="middle"
                      className="text-xs font-bold fill-foreground"
                      style={{ fontSize: "10px" }}
                    >
                      {node.task.name.length > 18
                        ? node.task.name.substring(0, 18) + "..."
                        : node.task.name}
                    </text>

                    {/* Middle section: Duration and Dates */}
                    <rect
                      x={node.x}
                      y={node.y + 25}
                      width={node.width}
                      height={50}
                      fill={isCritical ? "#fee2e2" : "#ffffff"}
                      stroke="none"
                    />
                    <line
                      x1={node.x}
                      y1={node.y + 50}
                      x2={node.x + node.width}
                      y2={node.y + 50}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />
                    <line
                      x1={node.x + node.width / 2}
                      y1={node.y + 25}
                      x2={node.x + node.width / 2}
                      y2={node.y + 75}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                    />

                    {/* Duration - Left side */}
                    <text
                      x={node.x + 5}
                      y={node.y + 40}
                      className="text-xs fill-muted-foreground font-semibold"
                      style={{ fontSize: "9px" }}
                    >
                      Dur: {node.task.duration}d
                    </text>

                    {/* Early Start - Top Left */}
                    {showDates && schedule && (
                      <text
                        x={node.x + 5}
                        y={node.y + 55}
                        className="text-xs fill-muted-foreground"
                        style={{ fontSize: "8px" }}
                      >
                        ES: {schedule.earlyStart}
                      </text>
                    )}

                    {/* Early Finish - Bottom Left */}
                    {showDates && schedule && (
                      <text
                        x={node.x + 5}
                        y={node.y + 70}
                        className="text-xs fill-muted-foreground"
                        style={{ fontSize: "8px" }}
                      >
                        EF: {schedule.earlyFinish}
                      </text>
                    )}

                    {/* Late Start - Top Right */}
                    {showDates && schedule && (
                      <text
                        x={node.x + node.width / 2 + 5}
                        y={node.y + 55}
                        className="text-xs fill-muted-foreground"
                        style={{ fontSize: "8px" }}
                      >
                        LS: {schedule.lateStart}
                      </text>
                    )}

                    {/* Late Finish - Bottom Right */}
                    {showDates && schedule && (
                      <text
                        x={node.x + node.width / 2 + 5}
                        y={node.y + 70}
                        className="text-xs fill-muted-foreground"
                        style={{ fontSize: "8px" }}
                      >
                        LF: {schedule.lateFinish}
                      </text>
                    )}

                    {/* Bottom section: Float */}
                    <rect
                      x={node.x}
                      y={node.y + 75}
                      width={node.width}
                      height={25}
                      fill={isCritical ? "#fee2e2" : schedule && schedule.totalFloat > 0 ? "#eff6ff" : "#ffffff"}
                      stroke="none"
                    />

                    {/* Float - Bottom Center */}
                    {showFloat && schedule && (
                      <text
                        x={node.x + node.width / 2}
                        y={node.y + 92}
                        textAnchor="middle"
                        className={`text-xs font-bold ${schedule.totalFloat === 0 ? "fill-red-600" : "fill-blue-600"}`}
                        style={{ fontSize: "9px" }}
                      >
                        {schedule.totalFloat === 0 ? "CRITICAL" : `Float: ${schedule.totalFloat}d`}
                      </text>
                    )}

                    {/* Critical indicator */}
                    {isCritical && (
                      <circle
                        cx={node.x + node.width - 10}
                        cy={node.y + 10}
                        r="5"
                        fill="#ef4444"
                      />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
              <div className="text-sm font-semibold mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-red-500 bg-red-50"></div>
                  <span>Critical Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white"></div>
                  <span>Normal Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-indigo-500 bg-indigo-50"></div>
                  <span>Summary Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-0.5 bg-red-500"></div>
                  <span>Critical Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-0.5 bg-slate-400"></div>
                  <span>Non-Critical</span>
                </div>
              </div>
            </div>

            {/* Critical Path Info */}
            {networkResult.isValid && (
              <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                <div className="text-sm font-semibold mb-2">Critical Path</div>
                <div className="text-xs space-y-1">
                  <div>Duration: <span className="font-bold">{networkResult.projectDuration} days</span></div>
                  <div>Tasks: <span className="font-bold">{networkResult.criticalPath.length}</span></div>
                  <div className="text-muted-foreground mt-2">
                    {networkResult.criticalPath.slice(0, 3).map((taskId, i) => {
                      const task = project.tasks.find(t => t.id === taskId)
                      return task ? (
                        <div key={i} className="truncate">{task.wbsCode}: {task.name.substring(0, 15)}...</div>
                      ) : null
                    })}
                    {networkResult.criticalPath.length > 3 && (
                      <div>+{networkResult.criticalPath.length - 3} more</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
