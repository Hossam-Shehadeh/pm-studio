"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, AtSign, Paperclip, X } from "lucide-react"
import type { Task, TaskComment } from "@/lib/types"
import { updateProject, getProjectById } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

interface TaskCommentsProps {
  task: Task
  projectId: string
  currentUserId?: string
  onUpdate?: () => void
}

export function TaskComments({ task, projectId, currentUserId = "current-user", onUpdate }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)

  // Extract mentions from comment text
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1])
    }
    return [...new Set(mentions)]
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const project = getProjectById(projectId)
      if (!project) return

      const mentions = extractMentions(newComment)
      const comment: TaskComment = {
        id: crypto.randomUUID(),
        taskId: task.id,
        userId: currentUserId,
        userName: "You", // In real app, get from user context
        content: newComment,
        mentions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update task with new comment
      const updatedTasks = project.tasks.map(t =>
        t.id === task.id
          ? { ...t, comments: [...(t.comments || []), comment] }
          : t
      )

      // Add to activity feed
      const activity = {
        id: crypto.randomUUID(),
        taskId: task.id,
        projectId,
        userId: currentUserId,
        userName: "You",
        action: "commented",
        details: `Commented on "${task.name}"`,
        timestamp: new Date().toISOString(),
      }

      updateProject({
        ...project,
        tasks: updatedTasks,
        activityFeed: [...(project.activityFeed || []), activity],
      })

      setNewComment("")
      onUpdate?.()
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  const comments = task.comments || []

  return (
    <Card className="gradient-card border-l-4 border-l-chart-1 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="size-5 text-chart-1" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="size-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/50">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {comment.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  {comment.mentions && comment.mentions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <AtSign className="size-3 text-muted-foreground" />
                      {comment.mentions.map(mention => (
                        <Badge key={mention} variant="outline" className="text-xs">
                          @{mention}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment... Use @ to mention someone"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Press Cmd/Ctrl + Enter to submit</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className="gap-2"
            >
              <Send className="size-4" />
              Comment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

