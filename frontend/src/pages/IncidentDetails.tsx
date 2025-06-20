import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { incidentsService } from '../services/incidents'
import { commentsService } from '../services/comments'
import { UpdateIncidentData } from '../types'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle, 
  ArrowUp,
  Edit,
  Send
} from 'lucide-react'
import { useForm } from 'react-hook-form'

interface CommentForm {
  content: string
  isInternal: boolean
}

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, joinIncident } = useSocket()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { register: registerComment, handleSubmit: handleCommentSubmit, reset: resetComment, formState: { errors: commentErrors } } = useForm<CommentForm>({
    defaultValues: {
      isInternal: false
    }
  })

  // Fetch incident details
  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => incidentsService.getIncident(id!),
    enabled: !!id,
  })

  // Join incident room for real-time updates
  useEffect(() => {
    if (id && socket) {
      joinIncident(id)
    }
  }, [id, socket, joinIncident])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const handleIncidentUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
    }

    socket.on('incident:updated', handleIncidentUpdate)
    socket.on('incident:commented', handleIncidentUpdate)

    return () => {
      socket.off('incident:updated', handleIncidentUpdate)
      socket.off('incident:commented', handleIncidentUpdate)
    }
  }, [socket, queryClient, id])

  // Update incident mutation
  const updateIncidentMutation = useMutation({
    mutationFn: (data: UpdateIncidentData) => incidentsService.updateIncident(id!, data),
    onSuccess: () => {
      toast.success('Incident updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      setIsEditing(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update incident')
    }
  })

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { incidentId: string; content: string; isInternal: boolean }) => 
      commentsService.createComment(data),
    onSuccess: () => {
      toast.success('Comment added successfully!')
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      resetComment()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment')
    }
  })

  const handleStatusChange = (status: string) => {
    updateIncidentMutation.mutate({ status } as UpdateIncidentData)
  }

  const handleAssignToSelf = () => {
    if (user?.role === 'operator') {
      updateIncidentMutation.mutate({ assignedTo: user.id })
    }
  }

  const onCommentSubmit = (data: CommentForm) => {
    if (!id) return
    createCommentMutation.mutate({
      incidentId: id,
      content: data.content,
      isInternal: data.isInternal
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'escalated':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5" />
      case 'in_progress':
        return <Clock className="h-5 w-5" />
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'escalated':
        return <ArrowUp className="h-5 w-5" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500'
    if (priority >= 3) return 'bg-yellow-500'
    if (priority >= 2) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Incident not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-500 hover:text-gray-700 mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Incident Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${getPriorityColor(incident.priority)}`} />
                  <h2 className="text-2xl font-bold text-gray-900">{incident.title}</h2>
                </div>
                {user?.role === 'operator' && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-ghost"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(incident.status)}`}>
                  {getStatusIcon(incident.status)}
                  <span>{incident.status.replace('_', ' ').toUpperCase()}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Priority {incident.priority}
                </span>
                <span className="text-sm text-gray-500">
                  {incident.incidentType?.name}
                </span>
              </div>

              {incident.description && (
                <p className="text-gray-700 mb-6">{incident.description}</p>
              )}

              {/* Dynamic Fields */}
              {incident.data && Object.keys(incident.data).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Additional Details</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {Object.entries(incident.data).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-sm text-gray-900">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Status Actions */}
              {user?.role === 'operator' && incident.status !== 'completed' && (
                <div className="flex space-x-3">
                  {incident.status === 'open' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="btn-primary"
                        disabled={updateIncidentMutation.isPending}
                      >
                        Start Working
                      </button>
                      {!incident.assignedTo && (
                        <button
                          onClick={handleAssignToSelf}
                          className="btn-secondary"
                          disabled={updateIncidentMutation.isPending}
                        >
                          Assign to Me
                        </button>
                      )}
                    </>
                  )}
                  {incident.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="btn-primary"
                        disabled={updateIncidentMutation.isPending}
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange('escalated')}
                        className="btn-destructive"
                        disabled={updateIncidentMutation.isPending}
                      >
                        Escalate
                      </button>
                    </>
                  )}
                  {incident.status === 'escalated' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="btn-primary"
                      disabled={updateIncidentMutation.isPending}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments ({incident.comments?.length || 0})
                </h3>
              </div>

              {/* Add Comment Form */}
              <div className="p-6 border-b border-gray-200">
                <form onSubmit={handleCommentSubmit(onCommentSubmit)} className="space-y-4">
                  <div>
                    <textarea
                      {...registerComment('content', { required: 'Comment is required' })}
                      className="textarea"
                      placeholder="Add a comment..."
                      rows={3}
                    />
                    {commentErrors.content && (
                      <p className="mt-1 text-sm text-red-600">{commentErrors.content.message}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {user?.role === 'operator' && (
                      <label className="flex items-center space-x-2">
                        <input
                          {...registerComment('isInternal')}
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Internal comment (operators only)</span>
                      </label>
                    )}
                    <button
                      type="submit"
                      disabled={createCommentMutation.isPending}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{createCommentMutation.isPending ? 'Adding...' : 'Add Comment'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Comments List */}
              <div className="divide-y divide-gray-200">
                {incident.comments && incident.comments.length > 0 ? (
                  incident.comments.map((comment) => (
                    <div key={comment.id} className={`p-6 ${comment.isInternal ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.user?.name || 'Unknown'}
                            </span>
                            {comment.isInternal && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Internal
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to add a comment to this incident.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Incident Meta */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Incident Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="text-sm text-gray-900">{incident.client?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reported By</dt>
                  <dd className="text-sm text-gray-900">{incident.reportedByUser?.name}</dd>
                </div>
                {incident.assignedToUser && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="text-sm text-gray-900">{incident.assignedToUser.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {format(new Date(incident.createdAt), 'PPP p')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {format(new Date(incident.updatedAt), 'PPP p')}
                  </dd>
                </div>
                {incident.resolvedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Resolved</dt>
                    <dd className="text-sm text-gray-900">
                      {format(new Date(incident.resolvedAt), 'PPP p')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Activity Log */}
            {incident.activityLogs && incident.activityLogs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-medium text-gray-900 mb-4">Activity Log</h3>
                <div className="space-y-3">
                  {incident.activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
