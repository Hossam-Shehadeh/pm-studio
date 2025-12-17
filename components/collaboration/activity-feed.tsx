"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Activity, MessageSquare, UserPlus, CheckCircle2, FileText, Calendar } from "lucide-react"
import type { TaskActivity, Project } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface ActivityFeedProps {
  project: Project
  taskId?: string
}

export function ActivityFeed({ project, taskId }: ActivityFeedProps) {
  const activities = project.activityFeed || []

  // Filter by task if specified
  const filteredActivities = taskId
    ? activities.filter(a => a.taskId === taskId)
    : activities

  // Sort by timestamp (newest first)
  const sortedActivities = [...filteredActivities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "commented":
        return <MessageSquare className="size-4" />
      case "created":
        return <FileText className="size-4" />
      case "updated":
        return <CheckCircle2 className="size-4" />
      case "assigned":
        return <UserPlus className="size-4" />
      case "attached_file":
        return <FileText className="size-4" />
      default:
        return <Activity className="size-4" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case "commented":
        return "text-blue-600"
      case "created":
        return "text-green-600"
      case "updated":
        return "text-yellow-600"
      case "assigned":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className="gradient-card border-l-4 border-l-chart-3 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="size-5 text-chart-3" />
          Activity Feed
          {taskId && <Badge variant="secondary">Task Only</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {sortedActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="size-12 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </div>
          ) : (
            sortedActivities.map(activity => (
              <div key={activity.id} className="flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {activity.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`${getActivityColor(activity.action)}`}>
                      {getActivityIcon(activity.action)}
                    </span>
                    <span className="font-semibold text-sm">{activity.userName}</span>
                    <span className="text-sm">{activity.details}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

