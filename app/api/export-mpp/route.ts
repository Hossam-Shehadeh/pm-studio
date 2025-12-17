import { NextRequest, NextResponse } from "next/server"
import type { Project } from "@/lib/types"
import JSZip from "jszip"

// Import XML generation functions (simplified version for server-side)
function formatDateForMSProject(dateString: string): string {
  if (!dateString || typeof dateString !== "string") {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}T08:00:00`
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}T08:00:00`
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}T08:00:00`
}

function formatDateISO(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

function formatDuration(days: number): string {
  const hours = Math.max(1, Math.round(days * 8))
  return `PT${hours}H0M0S`
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function generateMPPXML(project: Project): string {
  const projectName = (project.name || "Project").trim()
  let projectStartDate: Date
  try {
    projectStartDate = new Date(project.startDate)
    if (isNaN(projectStartDate.getTime())) {
      projectStartDate = new Date()
    }
  } catch {
    projectStartDate = new Date()
  }

  const taskUidMap = new Map<string, number>()
  project.tasks.forEach((task, index) => {
    taskUidMap.set(task.id, index + 1)
  })

  const resourceNameToUid = new Map<string, number>()
  project.resources.forEach((resource, index) => {
    if (resource.name) {
      resourceNameToUid.set(resource.name.trim(), index + 1)
    }
  })

  const now = new Date()
  const currentDate = formatDateISO(now.toISOString())

  const tasks = project.tasks.map((task, index) => {
    const uid = index + 1

    let taskStartDate: Date
    let taskEndDate: Date
    try {
      taskStartDate = new Date(task.startDate)
      if (isNaN(taskStartDate.getTime())) {
        taskStartDate = new Date(projectStartDate)
        taskStartDate.setDate(taskStartDate.getDate() + index)
      }
    } catch {
      taskStartDate = new Date(projectStartDate)
      taskStartDate.setDate(taskStartDate.getDate() + index)
    }

    try {
      taskEndDate = new Date(task.endDate)
      if (isNaN(taskEndDate.getTime()) || taskEndDate < taskStartDate) {
        taskEndDate = new Date(taskStartDate)
        taskEndDate.setDate(taskEndDate.getDate() + (task.duration || 1))
      }
    } catch {
      taskEndDate = new Date(taskStartDate)
      taskEndDate.setDate(taskEndDate.getDate() + (task.duration || 1))
    }

    const startDate = formatDateForMSProject(taskStartDate.toISOString())
    const finishDate = formatDateForMSProject(taskEndDate.toISOString())
    const daysDiff = Math.max(1, Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    const duration = formatDuration(daysDiff)

    // Include ALL dependencies
    let predecessors = ""
    if (task.dependencies && task.dependencies.length > 0) {
      const predUids = task.dependencies
        .map((depId) => {
          const predUid = taskUidMap.get(depId)
          return predUid ? predUid.toString() : null
        })
        .filter((uid) => uid !== null)

      if (predUids.length > 0) {
        predecessors = predUids.map((predUid) => `
      <PredecessorLink>
        <PredecessorUID>${predUid}</PredecessorUID>
        <Type>1</Type>
        <CrossProject>0</CrossProject>
      </PredecessorLink>`).join("")
      }
    }

    let wbsCode = (task.wbsCode || "").trim()
    if (!wbsCode) {
      const levelTasks = project.tasks.filter(t => t.level === task.level)
      const taskIndex = levelTasks.findIndex(t => t.id === task.id)
      if (task.parentId) {
        const parent = project.tasks.find(t => t.id === task.parentId)
        const parentWBS = parent?.wbsCode || ""
        const siblings = project.tasks.filter(t => t.parentId === task.parentId)
        const siblingIndex = siblings.findIndex(t => t.id === task.id)
        wbsCode = parentWBS ? `${parentWBS}.${siblingIndex + 1}` : `${task.level}.${siblingIndex + 1}`
      } else {
        wbsCode = `${taskIndex + 1}`
      }
    }

    const taskName = (task.name || `Task ${uid}`).trim()
    const outlineLevel = Math.max(1, Math.min(10, task.level || 1))
    const taskCost = typeof task.cost === "number" && !isNaN(task.cost) && task.cost >= 0 ? task.cost : 0
    const isSummary = !task.parentId && project.tasks.some(t => t.parentId === task.id)

    return `
    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${escapeXML(taskName)}</Name>
      <Type>0</Type>
      <IsNull>0</IsNull>
      <CreateDate>${startDate}</CreateDate>
      <WBS>${escapeXML(wbsCode)}</WBS>
      <OutlineNumber>${escapeXML(wbsCode)}</OutlineNumber>
      <OutlineLevel>${outlineLevel}</OutlineLevel>
      <Priority>500</Priority>
      <Start>${startDate}</Start>
      <Finish>${finishDate}</Finish>
      <Duration>${duration}</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>${duration}</Work>
      <Stop>${finishDate}</Stop>
      <Resume>${startDate}</Resume>
      <Cost>${taskCost.toFixed(2)}</Cost>
      <FixedCost>0.00</FixedCost>
      <FixedCostAccrual>3</FixedCostAccrual>
      <PercentComplete>0</PercentComplete>
      <PercentWorkComplete>0</PercentWorkComplete>
      <Critical>${task.isCriticalPath ? 1 : 0}</Critical>
      <Milestone>0</Milestone>
      <Summary>${isSummary ? 1 : 0}</Summary>
      <Active>1</Active>
      <Manual>0</Manual>
      ${predecessors}
      ${task.resource ? `<ResourceNames>${escapeXML(task.resource.trim())}</ResourceNames>` : ""}
    </Task>`
  }).join("")

  const resources = project.resources.map((resource, index) => {
    const resourceName = resource.name || `Resource ${index + 1}`
    const resourceRate = typeof resource.rate === "number" && !isNaN(resource.rate) ? resource.rate : 0
    const initials = resourceName.substring(0, Math.min(3, resourceName.length)).toUpperCase() || "RES"
    return `
    <Resource>
      <UID>${index + 1}</UID>
      <ID>${index + 1}</ID>
      <Name>${escapeXML(resourceName)}</Name>
      <Type>1</Type>
      <IsNull>0</IsNull>
      <Initials>${escapeXML(initials)}</Initials>
      <StandardRate Format="2">${resourceRate.toFixed(2)}</StandardRate>
      <OvertimeRate Format="2">${(resourceRate * 1.5).toFixed(2)}</OvertimeRate>
      <CostPerUse>0</CostPerUse>
      <AccrueAt>3</AccrueAt>
      <BaseCalendarUID>1</BaseCalendarUID>
      <MaxUnits>1</MaxUnits>
      <PeakUnits>1</PeakUnits>
    </Resource>`
  }).join("")

  let assignmentUID = 1
  const assignments = project.tasks
    .map((task, taskIndex) => {
      if (!task.resource) return ""
      const resourceName = task.resource.trim()
      const resourceUid = resourceNameToUid.get(resourceName)
      if (!resourceUid) return ""

      const taskUID = taskIndex + 1

      let taskStartDate: Date
      let taskEndDate: Date
      try {
        taskStartDate = new Date(task.startDate)
        if (isNaN(taskStartDate.getTime())) {
          taskStartDate = new Date(projectStartDate)
          taskStartDate.setDate(taskStartDate.getDate() + taskIndex)
        }
      } catch {
        taskStartDate = new Date(projectStartDate)
        taskStartDate.setDate(taskStartDate.getDate() + taskIndex)
      }

      try {
        taskEndDate = new Date(task.endDate)
        if (isNaN(taskEndDate.getTime()) || taskEndDate < taskStartDate) {
          taskEndDate = new Date(taskStartDate)
          taskEndDate.setDate(taskEndDate.getDate() + (task.duration || 1))
        }
      } catch {
        taskEndDate = new Date(taskStartDate)
        taskEndDate.setDate(taskEndDate.getDate() + (task.duration || 1))
      }

      const startDate = formatDateForMSProject(taskStartDate.toISOString())
      const finishDate = formatDateForMSProject(taskEndDate.toISOString())
      const daysDiff = Math.max(1, Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)))
      const duration = formatDuration(daysDiff)

      const assignmentCost = typeof task.cost === "number" && !isNaN(task.cost) && task.cost >= 0 ? task.cost : 0
      const uid = assignmentUID++

      return `
    <Assignment>
      <UID>${uid}</UID>
      <TaskUID>${taskUID}</TaskUID>
      <ResourceUID>${resourceUid}</ResourceUID>
      <PercentWorkComplete>0</PercentWorkComplete>
      <ActualWork>PT0H0M0S</ActualWork>
      <Work>${duration}</Work>
      <RegularWork>${duration}</RegularWork>
      <RemainingWork>${duration}</RemainingWork>
      <Start>${startDate}</Start>
      <Finish>${finishDate}</Finish>
      <Cost>${assignmentCost.toFixed(2)}</Cost>
      <Units>1</Units>
    </Assignment>`
    })
    .filter((a) => a !== "")
    .join("")

  const projectStartDateFormatted = formatDateForMSProject(projectStartDate.toISOString())

  let projectFinishDate = projectStartDate
  if (project.tasks.length > 0) {
    project.tasks.forEach((task) => {
      try {
        const taskFinish = new Date(task.endDate)
        if (!isNaN(taskFinish.getTime()) && taskFinish > projectFinishDate) {
          projectFinishDate = taskFinish
        }
      } catch {
        // Ignore invalid dates
      }
    })
  }
  if (projectFinishDate < projectStartDate) {
    projectFinishDate = new Date(projectStartDate)
    projectFinishDate.setDate(projectFinishDate.getDate() + 1)
  }
  const projectFinishDateFormatted = formatDateForMSProject(projectFinishDate.toISOString())

  const fyStartDate = `${projectStartDate.getFullYear()}-01-01T00:00:00`

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <SaveVersion>12</SaveVersion>
  <Name>${escapeXML(projectName)}</Name>
  <Title>${escapeXML(projectName)}</Title>
  <Author>AI Project Planner</Author>
  <Company></Company>
  <Manager></Manager>
  <CreationDate>${currentDate}</CreationDate>
  <LastSaved>${currentDate}</LastSaved>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>${projectStartDateFormatted}</StartDate>
  <FinishDate>${projectFinishDateFormatted}</FinishDate>
  <FYStartDate>${fyStartDate}</FYStartDate>
  <CriticalSlackLimit>0</CriticalSlackLimit>
  <CurrencyDigits>2</CurrencyDigits>
  <CurrencySymbol>$</CurrencySymbol>
  <CurrencySymbolPosition>0</CurrencySymbolPosition>
  <CalendarUID>1</CalendarUID>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <DefaultTaskType>0</DefaultTaskType>
  <DefaultFixedCostAccrual>3</DefaultFixedCostAccrual>
  <DurationFormat>7</DurationFormat>
  <WorkFormat>2</WorkFormat>
  <EditableActualCosts>0</EditableActualCosts>
  <HonorConstraints>0</HonorConstraints>
  <InsertedProjectsLikeSummary>0</InsertedProjectsLikeSummary>
  <MultipleCriticalPaths>0</MultipleCriticalPaths>
  <NewTasksEstimated>1</NewTasksEstimated>
  <NewTasksEffortDriven>1</NewTasksEffortDriven>
  <NewTasksAreManual>0</NewTasksAreManual>
  <SplitsInProgressTasks>0</SplitsInProgressTasks>
  <SpreadActualCost>0</SpreadActualCost>
  <SpreadPercentComplete>0</SpreadPercentComplete>
  <TaskUpdatesResource>1</TaskUpdatesResource>
  <FiscalYearStart>0</FiscalYearStart>
  <WeekStartDay>1</WeekStartDay>
  <MoveCompletedEndsBack>0</MoveCompletedEndsBack>
  <MoveRemainingStartsBack>0</MoveRemainingStartsBack>
  <MoveRemainingStartsForward>0</MoveRemainingStartsForward>
  <MoveCompletedEndsForward>0</MoveCompletedEndsForward>
  <BaselineForEarnedValue>0</BaselineForEarnedValue>
  <AutoAddNewResourcesAndTasks>1</AutoAddNewResourcesAndTasks>
  <StatusDate>${projectStartDateFormatted}</StatusDate>
  <CurrentDate>${projectStartDateFormatted}</CurrentDate>
  <Autolink>1</Autolink>
  <NewTaskStartDate>0</NewTaskStartDate>
  <DefaultTaskEVMethod>0</DefaultTaskEVMethod>
  <ProjectExternallyEdited>0</ProjectExternallyEdited>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>1</DayWorking>
          <TimePeriod>
            <FromDate>1900-01-01T08:00:00</FromDate>
            <ToDate>1900-01-01T17:00:00</ToDate>
          </TimePeriod>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType>
          <DayWorking>1</DayWorking>
          <TimePeriod>
            <FromDate>1900-01-01T08:00:00</FromDate>
            <ToDate>1900-01-01T17:00:00</ToDate>
          </TimePeriod>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType>
          <DayWorking>1</DayWorking>
          <TimePeriod>
            <FromDate>1900-01-01T08:00:00</FromDate>
            <ToDate>1900-01-01T17:00:00</ToDate>
          </TimePeriod>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType>
          <DayWorking>1</DayWorking>
          <TimePeriod>
            <FromDate>1900-01-01T08:00:00</FromDate>
            <ToDate>1900-01-01T17:00:00</ToDate>
          </TimePeriod>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType>
          <DayWorking>1</DayWorking>
          <TimePeriod>
            <FromDate>1900-01-01T08:00:00</FromDate>
            <ToDate>1900-01-01T17:00:00</ToDate>
          </TimePeriod>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>
${tasks}
  </Tasks>
  <Resources>
${resources}
  </Resources>
  <Assignments>
${assignments}
  </Assignments>
</Project>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project } = body

    if (!project) {
      return NextResponse.json({ error: "Project data required" }, { status: 400 })
    }

    // Generate MSPDI XML
    const xml = generateMPPXML(project)

    // Create ZIP archive with proper structure
    // Some tools can recognize this as MPP format
    const zip = new JSZip()

    // Add the project XML
    zip.file("project.xml", xml)

    // Add Content_Types.xml for Office Open XML compatibility
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/project.xml" ContentType="application/vnd.ms-project"/>
</Types>`)

    // Add relationships
    zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/project" Target="project.xml"/>
</Relationships>`)

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    })

    // Return as binary
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/vnd.ms-project",
        "Content-Disposition": `attachment; filename="${(project.name || "project").replace(/\s+/g, "-")}.mpp"`,
      },
    })
  } catch (error) {
    console.error("Error generating MPP file:", error)
    return NextResponse.json({ error: "Failed to generate MPP file" }, { status: 500 })
  }
}

