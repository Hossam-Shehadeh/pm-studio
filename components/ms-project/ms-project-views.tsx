"use client"

import type { Project } from "@/lib/types"
import { MSProjectGanttView } from "./views/ms-project-gantt-view"
import { MSProjectTaskSheetView } from "./views/ms-project-task-sheet-view"
import { NetworkDiagramView } from "@/components/project/views/network-diagram-view"
import { MSProjectResourceSheetView } from "./views/ms-project-resource-sheet-view"
import { MSProjectResourceUsageView } from "./views/ms-project-resource-usage-view"
import { MSProjectCalendarView } from "./views/ms-project-calendar-view"
import { MSProjectTimelineView } from "./views/ms-project-timeline-view"

interface MSProjectViewsProps {
  project: Project
  activeView: "gantt" | "task-sheet" | "network" | "resource-sheet" | "resource-usage" | "calendar" | "timeline"
  selectedTaskId: string | null
  onTaskSelect: (taskId: string | null) => void
  onShowTaskDetails: (show: boolean) => void
  onProjectUpdate?: (project: Project) => void
  zoomLevel?: number
  showCriticalPath?: boolean
  showBaseline?: boolean
  showSlack?: boolean
  showOverallocation?: boolean
}

export function MSProjectViews({
  project,
  activeView,
  selectedTaskId,
  onTaskSelect,
  onShowTaskDetails,
  onProjectUpdate,
  zoomLevel = 1,
  showCriticalPath = true,
  showBaseline = false,
  showSlack = false,
  showOverallocation = false
}: MSProjectViewsProps) {
  switch (activeView) {
    case "gantt":
      return (
        <MSProjectGanttView
          project={project}
          selectedTaskId={selectedTaskId}
          onTaskSelect={onTaskSelect}
          onShowTaskDetails={onShowTaskDetails}
          onProjectUpdate={onProjectUpdate}
          zoomLevel={zoomLevel}
          showCriticalPath={showCriticalPath}
          showBaseline={showBaseline}
        />
      )
    case "task-sheet":
      return (
        <MSProjectTaskSheetView
          project={project}
          selectedTaskId={selectedTaskId}
          onTaskSelect={onTaskSelect}
          onShowTaskDetails={onShowTaskDetails}
          onProjectUpdate={onProjectUpdate}
        />
      )
    case "network":
      return <NetworkDiagramView project={project} />
    case "resource-sheet":
      return <MSProjectResourceSheetView project={project} />
    case "resource-usage":
      return <MSProjectResourceUsageView project={project} showOverallocation={showOverallocation} />
    case "calendar":
      return <MSProjectCalendarView project={project} />
    case "timeline":
      return <MSProjectTimelineView project={project} />
    default:
      return <MSProjectGanttView project={project} selectedTaskId={selectedTaskId} onTaskSelect={onTaskSelect} onShowTaskDetails={onShowTaskDetails} onProjectUpdate={onProjectUpdate} zoomLevel={zoomLevel} showCriticalPath={showCriticalPath} showBaseline={showBaseline} />
  }
}

