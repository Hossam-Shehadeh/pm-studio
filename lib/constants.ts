export const PROJECT_TYPES = [
  { value: "mobile-app", label: "Mobile App" },
  { value: "e-commerce", label: "E-Commerce Platform" },
  { value: "saas-platform", label: "SaaS Dashboard" },
  { value: "crm-system", label: "CRM System" },
  { value: "booking-app", label: "Booking App" },
  { value: "hospital-system", label: "Hospital System" },
  { value: "school-system", label: "School System" },
  { value: "custom", label: "Custom Project" },
] as const

export const RESOURCE_ROLES = [
  "Project Manager",
  "Frontend Developer",
  "Backend Developer",
  "AI Engineer",
  "Database Engineer",
  "QA Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
] as const

export const RESOURCE_RATES: Record<string, number> = {
  "Project Manager": 150,
  "Frontend Developer": 120,
  "Backend Developer": 130,
  "AI Engineer": 150,
  "Database Engineer": 125,
  "QA Engineer": 90,
  "DevOps Engineer": 135,
  "UI/UX Designer": 110,
}
