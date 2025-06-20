import { api } from './api'
import { User, AuthResponse } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async register(userData: {
    email: string
    password: string
    name: string
    role: 'operator' | 'client'
    clientId?: string
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout() {
    localStorage.removeItem('token')
  },

  setToken(token: string) {
    localStorage.setItem('token', token)
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  }
}
