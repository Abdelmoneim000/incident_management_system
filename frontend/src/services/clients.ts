import { api } from './api'
import { Client } from '../types'

export const clientsService = {
  async getClients(): Promise<Client[]> {
    const response = await api.get('/clients')
    return response.data
  },

  async getClient(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`)
    return response.data
  }
}
