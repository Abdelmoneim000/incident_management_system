import { Incident } from '../types'
import { formatDistanceToNow } from 'date-fns'
import { Clock, MessageCircle, User, AlertCircle } from 'lucide-react'

interface ActivityFeedProps {
  incidents: Incident[]
}

export default function ActivityFeed({ incidents }: ActivityFeedProps) {
  // Get recent activity from incidents
  const getRecentActivity = () => {
    const activities: Array<{
      id: string
      type: 'incident' | 'comment' | 'status_change'
      title: string
      description: string
      timestamp: string
      incident: Incident
    }> = []

    incidents.forEach((incident) => {
      // Add incident creation
      activities.push({
        id: `incident-${incident.id}`,
        type: 'incident',
        title: 'New Incident Created',
        description: incident.title,
        timestamp: incident.createdAt,
        incident
      })

      // Add recent comments
      incident.comments?.slice(0, 2).forEach((comment) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          title: 'New Comment',
          description: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
          timestamp: comment.createdAt,
          incident
        })
      })

      // Add status changes from activity logs
      incident.activityLogs?.filter(log => log.action === 'status_changed').slice(0, 1).forEach((log) => {
        activities.push({
          id: `log-${log.id}`,
          type: 'status_change',
          title: 'Status Changed',
          description: log.description,
          timestamp: log.createdAt,
          incident
        })
      })
    })

    // Sort by timestamp (most recent first) and take top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }

  const recentActivity = getRecentActivity()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'status_change':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
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

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.incident.status)}`}>
                      {activity.incident.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500">
              Activity will appear here as incidents are created and updated.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
