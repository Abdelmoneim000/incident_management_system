export interface User {
  id: string
  email: string
  name: string
  role: 'operator' | 'client'
  clientId?: string
  client?: Client
}

export interface Client {
  id: string
  name: string
  slug: string
  description?: string
  config: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
  incidentTypes?: IncidentType[]
  users?: User[]
}

export interface IncidentType {
  id: string
  clientId: string
  name: string
  description?: string
  priority: number
  fields: FormField[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  client?: Client
}

export interface FormField {
  name: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox'
  label: string
  required: boolean
  options?: string[]
}

export interface Incident {
  id: string
  clientId: string
  incidentTypeId: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'completed' | 'escalated'
  priority: number
  assignedTo?: string
  reportedBy: string
  data: Record<string, any>
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  client?: Client
  incidentType?: IncidentType
  assignedToUser?: User
  reportedByUser?: User
  activityLogs?: ActivityLog[]
  comments?: Comment[]
}

export interface ActivityLog {
  id: string
  incidentId: string
  userId: string
  action: string
  description: string
  metadata: Record<string, any>
  createdAt: string
  user?: User
}

export interface Comment {
  id: string
  incidentId: string
  userId: string
  content: string
  isInternal: boolean
  createdAt: string
  updatedAt: string
  user?: User
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateIncidentData {
  clientId: string
  incidentTypeId: string
  title: string
  description?: string
  priority: number
  data: Record<string, any>
}

export interface UpdateIncidentData {
  title?: string
  description?: string
  status?: 'open' | 'in_progress' | 'completed' | 'escalated'
  priority?: number
  assignedTo?: string
  data?: Record<string, any>
}

export interface CreateCommentData {
  incidentId: string
  content: string
  isInternal: boolean
}
