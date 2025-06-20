import { api } from './api'
import { Comment, CreateCommentData } from '../types'

export const commentsService = {
  async getComments(incidentId: string): Promise<Comment[]> {
    const response = await api.get(`/comments/incident/${incidentId}`)
    return response.data
  },

  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await api.post('/comments', data)
    return response.data
  }
}
