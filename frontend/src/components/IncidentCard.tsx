import { useNavigate } from 'react-router-dom'
import { Incident } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { Clock, User, AlertCircle, CheckCircle, ArrowUp } from 'lucide-react'

interface IncidentCardProps {
  incident: Incident
}

export default function IncidentCard({ incident }: IncidentCardProps) {
  const navigate = useNavigate()

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
        return <AlertCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'escalated':
        return <ArrowUp className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500'
    if (priority >= 3) return 'bg-yellow-500'
    if (priority >= 2) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  return (
    <div
      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/incident/${incident.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(incident.priority)}`} />
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {incident.title}
            </h3>
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
              {getStatusIcon(incident.status)}
              <span className="ml-1">{incident.status.replace('_', ' ').toUpperCase()}</span>
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {incident.description}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{incident.reportedByUser?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}</span>
            </div>
            {incident.incidentType && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {incident.incidentType.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="text-sm text-gray-500">
            Priority {incident.priority}
          </div>
          {incident.assignedToUser && (
            <div className="text-xs text-gray-500">
              Assigned to {incident.assignedToUser.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
