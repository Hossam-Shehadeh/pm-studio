import type { Project } from "./types"

export async function exportToMPP(project: Project): Promise<string> {
  try {
    // Save with .xml so users know to import via Microsoft Project's XML option
    const fileName = `${(project.name || "Project").replace(/\s+/g, "-")}.xml`

    const xml = generateMPPXML(project)

    if (!xml || xml.trim().length === 0) {
      throw new Error("Generated XML is empty")
    }

    const blob = new Blob([xml], {
      type: "application/xml;charset=utf-8"
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return `Downloaded as XML. Open it with Microsoft Project via File > Open (choose XML format if prompted).`
  } catch (error) {
    console.error("Error exporting MPP:", error)
    throw new Error(`Failed to export file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function exportToXML(project: Project) {
  // Create XML structure for Microsoft Project 2013 (XML format)
  const xml = generateMPPXML(project)

  // Create and download file with .xml extension
  // Use text/plain to ensure it's saved as plain text XML
  // MS Project will recognize it when opened with "XML Format" file type
  const blob = new Blob([xml], { type: "text/xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${project.name.replace(/\s+/g, "-")}.xml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatDateForMSProject(dateString: string): string {
  // Convert date string to MS Project format (YYYY-MM-DDTHH:MM:SS)
  // MS Project expects dates with time set to 08:00:00 for start of day
  if (!dateString || typeof dateString !== "string") {
    // Return current date if invalid
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}T08:00:00`
  }
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // Return current date if invalid
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
  // Format date for ISO fields like CreationDate - MS Project doesn't accept "Z" timezone
  // Format: YYYY-MM-DDTHH:MM:SS (no timezone, no milliseconds)
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

function formatDateOnly(dateString: string): string {
  // Format date without time for fields like FYStartDate
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    const now = new Date()
    return `${now.getFullYear()}-01-01T00:00:00`
  }
  const year = date.getFullYear()
  return `${year}-01-01T00:00:00`
}

function formatDuration(days: number): string {
  // Convert days to MS Project duration format (PT#H0M0S)
  // Ensure minimum 1 hour to avoid invalid durations
  const hours = Math.max(1, Math.round(days * 8)) // Assuming 8 hours per day
  return `PT${hours}H0M0S`
}

function formatRate(rate: number): string {
  // Format rate for MS Project (rate per hour)
  // MS Project expects format like "100.00" for $100/hour
  return rate.toFixed(2)
}

function generateMPPXML(project: Project): string {
  // Validate and prepare project data
  const projectName = (project.name || "Project").trim()
  if (!projectName) {
    throw new Error("Project name is required")
  }

  // Ensure we have valid start date
  let projectStartDate: Date
  try {
    projectStartDate = new Date(project.startDate)
    if (isNaN(projectStartDate.getTime())) {
      projectStartDate = new Date()
    }
  } catch {
    projectStartDate = new Date()
  }

  // Create task UID mapping for dependencies
  const taskUidMap = new Map<string, number>()
  project.tasks.forEach((task, index) => {
    taskUidMap.set(task.id, index + 1)
  })

  // Create resource UID mapping
  const resourceUidMap = new Map<string, number>()
  project.resources.forEach((resource, index) => {
    resourceUidMap.set(resource.id, index + 1)
  })

  // Create resource name to UID mapping
  const resourceNameToUid = new Map<string, number>()
  project.resources.forEach((resource, index) => {
    if (resource.name) {
      resourceNameToUid.set(resource.name.trim(), index + 1)
    }
  })

  // Define current date for use in tasks (use local time, no timezone)
  const now = new Date()
  const currentDate = formatDateISO(now.toISOString())

  const tasks = project.tasks
    .map((task, index) => {
      const uid = index + 1

      // Validate and format dates
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

      // Calculate duration in days
      const daysDiff = Math.max(1, Math.ceil((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)))
      const duration = formatDuration(daysDiff)

      // Build predecessors string if dependencies exist
      // MS Project supports multiple predecessors - include ALL dependencies
      let predecessors = ""
      if (task.dependencies && task.dependencies.length > 0) {
        const predUids = task.dependencies
          .map((depId) => {
            const predUid = taskUidMap.get(depId)
            return predUid ? predUid.toString() : null
          })
          .filter((uid) => uid !== null)

        // Create PredecessorLink for each dependency
        if (predUids.length > 0) {
          predecessors = predUids.map((predUid) => `
      <PredecessorLink>
        <PredecessorUID>${predUid}</PredecessorUID>
        <Type>1</Type>
        <CrossProject>0</CrossProject>
      </PredecessorLink>`).join("")
        }
      }

      const taskName = (task.name || `Task ${uid}`).trim()
      // Ensure WBS code is always present - generate if missing
      let wbsCode = (task.wbsCode || "").trim()
      if (!wbsCode) {
        // Generate WBS code based on task level and position
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
      <Contact></Contact>
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
      <BCWS>0.00</BCWS>
      <BCWP>0.00</BCWP>
      <ACWP>0.00</ACWP>
      <SV>0.00</SV>
      <CV>0.00</CV>
      <EAC>0.00</EAC>
      <VAC>0.00</VAC>
      <TCPI>0.00</TCPI>
      <Critical>${task.isCriticalPath ? 1 : 0}</Critical>
      <Milestone>0</Milestone>
      <Summary>${isSummary ? 1 : 0}</Summary>
      <Active>1</Active>
      <Manual>0</Manual>
      <LevelingDelay>0</LevelingDelay>
      <LevelingCanSplit>1</LevelingCanSplit>
      ${predecessors}
      ${task.resource ? `<ResourceNames>${escapeXML(task.resource.trim())}</ResourceNames>` : ""}
    </Task>`
    })
    .join("\n")

  const resources = project.resources
    .map(
      (resource, index) => {
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
      <StandardRate Format="2">${formatRate(resourceRate)}</StandardRate>
      <OvertimeRate Format="2">${formatRate(resourceRate * 1.5)}</OvertimeRate>
      <CostPerUse>0</CostPerUse>
      <AccrueAt>3</AccrueAt>
      <BaseCalendarUID>1</BaseCalendarUID>
      <MaxUnits>1</MaxUnits>
      <PeakUnits>1</PeakUnits>
    </Resource>`
      }
    )
    .join("\n")

  // Build assignments section
  let assignmentUID = 1
  const assignments = project.tasks
    .map((task, taskIndex) => {
      if (!task.resource) return ""
      const resourceName = task.resource.trim()
      const resourceUid = resourceNameToUid.get(resourceName)
      if (!resourceUid) return ""

      const taskUID = taskIndex + 1

      // Use same dates as task
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
    .join("\n")

  const projectStartDateFormatted = formatDateForMSProject(projectStartDate.toISOString())

  // Calculate project finish date from tasks
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
  // Ensure finish date is at least start date
  if (projectFinishDate < projectStartDate) {
    projectFinishDate = new Date(projectStartDate)
    projectFinishDate.setDate(projectFinishDate.getDate() + 1)
  }
  const projectFinishDateFormatted = formatDateForMSProject(projectFinishDate.toISOString())

  const fyStartDate = formatDateOnly(projectStartDate.toISOString())

  // Ensure we have at least one task or resource for valid XML
  const hasTasks = project.tasks && project.tasks.length > 0
  const hasResources = project.resources && project.resources.length > 0

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

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
