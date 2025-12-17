"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANNER_TEMPLATES } from "@/lib/templates"
import type { PlannerTemplate } from "@/lib/templates"

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void
  selectedTemplateId?: string
}

export function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PLANNER_TEMPLATES.map((template) => (
        <Card
          key={template.id}
          className={`gradient-card border-l-4 border-l-${template.color} shadow-lg hover:shadow-xl transition-all cursor-pointer ${
            selectedTemplateId === template.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelect(template.id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="text-4xl mb-2">{template.icon}</div>
              <Badge className={`bg-${template.color} text-white`}>
                {template.planType}
              </Badge>
            </div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="text-sm">{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <div className="font-semibold mb-1">Phases:</div>
              <ul className="list-disc list-inside space-y-1">
                {template.phases.slice(0, 3).map((phase, i) => (
                  <li key={i}>{phase.name}</li>
                ))}
                {template.phases.length > 3 && (
                  <li className="text-muted-foreground/70">
                    +{template.phases.length - 3} more phases
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

