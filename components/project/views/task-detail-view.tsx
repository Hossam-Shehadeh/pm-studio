"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskComments } from "@/components/collaboration/task-comments"
import { TaskAttachments } from "@/components/collaboration/task-attachments"
import { ActivityFeed } from "@/components/collaboration/activity-feed"
import type { Task, Project } from "@/lib/types"

interface TaskDetailViewProps {
  task: Task
  project: Project
  onUpdate?: () => void
}

export function TaskDetailView({ task, project, onUpdate }: TaskDetailViewProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-6">
          <TaskComments
            task={task}
            projectId={project.id}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="attachments" className="mt-6">
          <TaskAttachments
            task={task}
            projectId={project.id}
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityFeed project={project} taskId={task.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

