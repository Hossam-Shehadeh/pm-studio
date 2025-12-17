"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, Download, Sparkles, Edit2, Check, X } from "lucide-react"
import type { Project } from "@/lib/types"
import { exportToMPP } from "@/lib/mpp-export"
import { updateProject, getProjectById } from "@/lib/storage"
import { useState, useEffect } from "react"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [editDesc, setEditDesc] = useState(project.description)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  // Sync local state when project prop changes
  useEffect(() => {
    if (!isEditingName) {
      setEditName(project.name)
    }
    if (!isEditingDesc) {
      setEditDesc(project.description)
    }
  }, [project.name, project.description, isEditingName, isEditingDesc])

  const handleExportMPP = async () => {
    setExportMessage(null)
    setIsExporting(true)
    try {
      const latestProject = getProjectById(project.id) || project
      const message = await exportToMPP(latestProject)
      setExportMessage(message)
    } catch (error) {
      setExportMessage("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const saveName = () => {
    updateProject({ ...project, name: editName })
    setIsEditingName(false)
  }

  const saveDesc = () => {
    updateProject({ ...project, description: editDesc })
    setIsEditingDesc(false)
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
    <header className="border-b-2 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 sticky top-0 z-50 shadow-lg backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
              <ChevronLeft className="size-5" />
            </Button>
          </Link>
          <div className="size-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <Sparkles className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold h-10"
                />
                <Button size="icon" variant="ghost" className="text-success shrink-0" onClick={saveName}>
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent flex items-center gap-2 group cursor-pointer"
                onClick={() => setIsEditingName(true)}
              >
                {project.name}
                <Edit2 className="size-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
              </h1>
            )}
            {isEditingDesc ? (
              <div className="flex items-center gap-2 mt-1">
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="text-sm" />
                <Button size="icon" variant="ghost" className="size-7 text-success shrink-0" onClick={saveDesc}>
                  <Check className="size-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive shrink-0"
                  onClick={() => setIsEditingDesc(false)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <p
                className="text-sm md:text-base text-muted-foreground group cursor-pointer flex items-center gap-2"
                onClick={() => setIsEditingDesc(true)}
              >
                {project.description}
                <Edit2 className="size-3 opacity-0 group-hover:opacity-100" />
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge className={`${getStatusColor(project.status)} text-base px-4 py-1.5 shadow-lg`}>
              {project.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-primary/30 hover:bg-primary/10 hover:border-primary font-semibold bg-transparent"
            >
              <Sparkles className="size-4 text-primary" />
              AI Insights
            </Button>
            <Button
              size="sm"
              className="gap-2 gradient-primary shadow-lg shadow-primary/40 hover:shadow-primary/60 transition-all font-semibold"
              disabled={isExporting}
              onClick={() => {
                setExportMessage(null)
                setShowExportDialog(true)
              }}
            >
              <Download className="size-4" />
              {isExporting ? "Preparing XML..." : "Download for MS Project"}
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download for Microsoft Project</DialogTitle>
            <DialogDescription>
              The file will download as XML. Open it in Microsoft Project via File &gt; Open and choose XML format if prompted.
            </DialogDescription>
          </DialogHeader>
          {exportMessage && <p className="text-sm text-muted-foreground">{exportMessage}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExportMPP} disabled={isExporting}>
              {isExporting ? "Downloading..." : "Download XML"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
