"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutList, BarChart3, Network, Users, DollarSign, Sparkles } from "lucide-react"
import { WBSView } from "@/components/project/views/wbs-view"
import { GanttView } from "@/components/project/views/gantt-view"
import { NetworkDiagramView } from "@/components/project/views/network-diagram-view"
import { ResourcesView } from "@/components/project/views/resources-view"
import { BudgetView } from "@/components/project/views/budget-view"
import { AIInsightsView } from "@/components/project/views/ai-insights-view"
import type { Project } from "@/lib/types"

interface ProjectTabsProps {
  project: Project
  onUpdate?: () => void
}

export function ProjectTabs({ project, onUpdate }: ProjectTabsProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="wbs" className="w-full">
        <TabsList className="grid w-full grid-cols-6 max-w-4xl">
          <TabsTrigger value="wbs" className="gap-2">
            <LayoutList className="size-4" />
            <span className="hidden sm:inline">WBS</span>
          </TabsTrigger>
          <TabsTrigger value="gantt" className="gap-2">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Gantt</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2">
            <Network className="size-4" />
            <span className="hidden sm:inline">Network</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="gap-2">
            <DollarSign className="size-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wbs" className="mt-6">
          <WBSView project={project} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="gantt" className="mt-6">
          <GanttView project={project} />
        </TabsContent>

        <TabsContent value="network" className="mt-6">
          <NetworkDiagramView project={project} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourcesView project={project} />
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <BudgetView project={project} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <AIInsightsView project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
