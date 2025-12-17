"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Sparkles } from "lucide-react"
import { createProject, saveProject } from "@/lib/storage"
import { PROJECT_TYPES } from "@/lib/constants"
import { createProjectFromTemplate, PLANNER_TEMPLATES } from "@/lib/templates"
import { TemplateSelector } from "@/components/templates/template-selector"

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("")
  const [useTemplate, setUseTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreate = async () => {
    if (!name) return
    if (!useTemplate && !type) return
    if (useTemplate && !selectedTemplate) return

    setIsGenerating(true)

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let project
    if (useTemplate && selectedTemplate) {
      // Create from template
      project = createProjectFromTemplate(selectedTemplate, name, description)
      // Save the project
      saveProject(project)
    } else {
      // Create standard project
      project = createProject({
        name,
        description,
        type: type as any,
      })
    }

    setIsGenerating(false)
    setOpen(false)
    router.push(`/project/${project.id}`)
  }

  if (!mounted) {
    return (
      <Button className="gap-2">
        <Plus className="size-4" />
        New Project
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            AI will automatically generate a complete project plan with WBS, timeline, and resources
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={!useTemplate ? "default" : "outline"}
              onClick={() => setUseTemplate(false)}
              className="flex-1"
            >
              Standard Project
            </Button>
            <Button
              type="button"
              variant={useTemplate ? "default" : "outline"}
              onClick={() => setUseTemplate(true)}
              className="flex-1"
            >
              Use Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="e.g., E-Commerce Platform Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {useTemplate ? (
            <div className="space-y-2">
              <Label>Select Template</Label>
              <div className="max-h-[400px] overflow-y-auto">
                <TemplateSelector
                  onSelect={setSelectedTemplate}
                  selectedTemplateId={selectedTemplate}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="type">Project Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your project goals and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name || (!useTemplate && !type) || (useTemplate && !selectedTemplate) || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="size-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
