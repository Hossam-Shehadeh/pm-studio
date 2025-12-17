"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paperclip, Download, Trash2, Upload, File } from "lucide-react"
import type { Task, TaskAttachment } from "@/lib/types"
import { updateProject, getProjectById } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

interface TaskAttachmentsProps {
  task: Task
  projectId: string
  currentUserId?: string
  onUpdate?: () => void
}

export function TaskAttachments({ task, projectId, currentUserId = "current-user", onUpdate }: TaskAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const project = getProjectById(projectId)
      if (!project) return

      const newAttachments: TaskAttachment[] = []

      for (const file of Array.from(files)) {
        // In a real app, upload to storage service (S3, etc.)
        // For now, create a data URL or use a placeholder
        const fileUrl = URL.createObjectURL(file)

        const attachment: TaskAttachment = {
          id: crypto.randomUUID(),
          taskId: task.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          url: fileUrl,
          uploadedBy: currentUserId,
          uploadedAt: new Date().toISOString(),
          version: 1,
        }

        newAttachments.push(attachment)
      }

      // Update task with new attachments
      const updatedTasks = project.tasks.map(t =>
        t.id === task.id
          ? { ...t, attachments: [...(t.attachments || []), ...newAttachments] }
          : t
      )

      // Add to activity feed
      const activity = {
        id: crypto.randomUUID(),
        taskId: task.id,
        projectId,
        userId: currentUserId,
        userName: "You",
        action: "attached_file",
        details: `Attached ${newAttachments.length} file(s) to "${task.name}"`,
        timestamp: new Date().toISOString(),
      }

      updateProject({
        ...project,
        tasks: updatedTasks,
        activityFeed: [...(project.activityFeed || []), activity],
      })

      onUpdate?.()
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDelete = (attachmentId: string) => {
    const project = getProjectById(projectId)
    if (!project) return

    const updatedTasks = project.tasks.map(t =>
      t.id === task.id
        ? { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) }
        : t
    )

    updateProject({
      ...project,
      tasks: updatedTasks,
    })

    onUpdate?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("document")) return "📝"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "📊"
    return "📎"
  }

  const attachments = task.attachments || []

  return (
    <Card className="gradient-card border-l-4 border-l-chart-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="size-5 text-chart-2" />
            Attachments ({attachments.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="size-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-2">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="size-12 mx-auto mb-2 opacity-50" />
              <p>No attachments yet</p>
            </div>
          ) : (
            attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50"
              >
                <div className="text-2xl">{getFileIcon(attachment.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{attachment.fileName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(attachment.uploadedAt), { addSuffix: true })}</span>
                    {attachment.version > 1 && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          v{attachment.version}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(attachment.url, "_blank")}
                    className="size-8"
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(attachment.id)}
                    className="size-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

