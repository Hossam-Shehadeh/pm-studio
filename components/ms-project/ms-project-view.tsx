"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Project } from "@/lib/types"
import { MSProjectRibbon } from "./ms-project-ribbon"
import { MSProjectViews } from "./ms-project-views"
import { MSProjectStatusBar } from "./ms-project-status-bar"
import { MSProjectStatistics } from "./ms-project-statistics"
import { MSProjectTaskDetails } from "./ms-project-task-details"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface MSProjectViewProps {
  projects: Project[]
  selectedProject: Project | null
  onProjectChange: (project: Project) => void
}

export function MSProjectView({ projects, selectedProject, onProjectChange }: MSProjectViewProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<"gantt" | "task-sheet" | "network" | "resource-sheet" | "resource-usage" | "calendar" | "timeline">("gantt")
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [showStatistics, setShowStatistics] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [localProject, setLocalProject] = useState<Project | null>(selectedProject)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [showBaseline, setShowBaseline] = useState(false)
  const [showSlack, setShowSlack] = useState(false)
  const [showOverallocation, setShowOverallocation] = useState(false)

  // Update local project when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      setLocalProject(selectedProject)
    }
  }, [selectedProject])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        // Save is handled in ribbon
      }
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        // Undo is handled in ribbon
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === "z") || e.key === "y") {
        e.preventDefault()
        // Redo is handled in ribbon
      }
      // Escape: Close task details
      if (e.key === "Escape" && showTaskDetails) {
        setShowTaskDetails(false)
        setSelectedTaskId(null)
        setShowStatistics(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showTaskDetails])

  if (!selectedProject) {
    return null
  }

  const handleProjectSelect = (project: Project) => {
    onProjectChange(project)
    router.push(`/ms-project/${project.id}`)
  }

  return (
    <div className="h-screen flex flex-col bg-[#f3f3f3]">
      {/* MS Project Title Bar */}
      <div className="h-8 bg-[#0078d4] flex items-center justify-between px-4 text-white text-sm font-medium">
        <div className="flex items-center gap-4">
          <span>Microsoft Project</span>
          <div className="w-px h-4 bg-white/30" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded">
                <span className="font-semibold">{selectedProject.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={project.id === selectedProject.id ? "bg-blue-50" : ""}
                >
                  <div className="flex flex-col">
                    <span className={`font-medium ${project.id === selectedProject.id ? "text-blue-600" : ""}`}>
                      {project.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {project.tasks.length} tasks • {project.duration} days
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => router.push("/ms-project")}
            className="hover:bg-white/10 px-2 py-0.5 rounded"
          >
            All Projects
          </button>
        </div>
      </div>

      {/* MS Project Ribbon */}
      <MSProjectRibbon
        activeView={activeView}
        onViewChange={setActiveView}
        project={localProject || selectedProject}
        onProjectChange={(updatedProject) => {
          setLocalProject(updatedProject)
          onProjectChange(updatedProject)
        }}
        projects={projects}
        selectedTaskId={selectedTaskId}
        onTaskSelect={setSelectedTaskId}
        showStatistics={showStatistics}
        onToggleStatistics={() => setShowStatistics(!showStatistics)}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        showCriticalPath={showCriticalPath}
        onCriticalPathToggle={setShowCriticalPath}
        showBaseline={showBaseline}
        onBaselineToggle={setShowBaseline}
        showSlack={showSlack}
        onSlackToggle={setShowSlack}
        showOverallocation={showOverallocation}
        onOverallocationToggle={setShowOverallocation}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* View Content */}
        <div className="flex-1 overflow-auto">
          <MSProjectViews
            project={localProject || selectedProject}
            activeView={activeView}
            selectedTaskId={selectedTaskId}
            onTaskSelect={setSelectedTaskId}
            onShowTaskDetails={(show) => {
              setShowTaskDetails(show)
            }}
            onProjectUpdate={(updatedProject) => {
              setLocalProject(updatedProject)
              onProjectChange(updatedProject)
            }}
            zoomLevel={zoomLevel}
            showCriticalPath={showCriticalPath}
            showBaseline={showBaseline}
            showSlack={showSlack}
            showOverallocation={showOverallocation}
          />
        </div>

        {/* Statistics Panel (Right Side) */}
        {showStatistics && !showTaskDetails && (
          <MSProjectStatistics project={localProject || selectedProject} />
        )}

        {/* Task Details Panel (Right Side) - Overrides Statistics */}
        {showTaskDetails && selectedTaskId && (
          <MSProjectTaskDetails
            project={localProject || selectedProject}
            taskId={selectedTaskId}
            onClose={() => {
              setShowTaskDetails(false)
              setSelectedTaskId(null)
            }}
            onUpdate={(updatedProject) => {
              setLocalProject(updatedProject)
              onProjectChange(updatedProject)
            }}
          />
        )}
      </div>

      {/* MS Project Status Bar */}
      <MSProjectStatusBar project={selectedProject} />
    </div>
  )
}

