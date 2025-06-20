import { api } from './api'
import { Incident, CreateIncidentData, UpdateIncidentData } from '../types'

export const incidentsService = {
  async getIncidents(params?: { status?: string; clientId?: string }): Promise<Incident[]> {
    const response = await api.get('/incidents', { params })
    return response.data
  },

  async getIncident(id: string): Promise<Incident> {
    const response = await api.get(`/incidents/${id}`)
    return response.data
  },

  async createIncident(data: CreateIncidentData): Promise<Incident> {
    const response = await api.post('/incidents', data)
    return response.data
  },

  async updateIncident(id: string, data: UpdateIncidentData): Promise<Incident> {
    const response = await api.put(`/incidents/${id}`, data)
    return response.data
  }
}
