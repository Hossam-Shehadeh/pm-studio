"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ListTodo, FolderKanban, Sparkles } from "lucide-react"
import { MyDayView } from "./my-day-view"
import { MyTasksView } from "./my-tasks-view"
import { MyPlansView } from "./my-plans-view"

interface PlannerViewProps {
  userId?: string
}

export function PlannerView({ userId = "current-user" }: PlannerViewProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="my-day" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="my-day" className="gap-2">
            <Calendar className="size-4" />
            <span>My Day</span>
          </TabsTrigger>
          <TabsTrigger value="my-tasks" className="gap-2">
            <ListTodo className="size-4" />
            <span>My Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="my-plans" className="gap-2">
            <FolderKanban className="size-4" />
            <span>My Plans</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-day" className="mt-6">
          <MyDayView userId={userId} />
        </TabsContent>

        <TabsContent value="my-tasks" className="mt-6">
          <MyTasksView userId={userId} />
        </TabsContent>

        <TabsContent value="my-plans" className="mt-6">
          <MyPlansView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

