import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { incidentsService } from '../services/incidents'
// import { Incident } from '../types'
import { toast } from 'react-hot-toast'
import { 
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowUp,
  Plus
} from 'lucide-react'
import IncidentCard from '../components/IncidentCard.tsx'
import CreateIncidentModal from '../components/CreateIncidentModal.tsx'
import ActivityFeed from '../components/ActivityFeed'

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const { socket, joinClient } = useSocket()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Fetch incidents for the client
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', user?.clientId, statusFilter],
    queryFn: () => incidentsService.getIncidents({
      clientId: user?.clientId,
      status: statusFilter === 'all' ? undefined : statusFilter
    }),
    enabled: !!user?.clientId,
  })

  // Join client room
  useEffect(() => {
    if (user?.clientId && socket) {
      joinClient(user.clientId)
    }
  }, [user?.clientId, socket, joinClient])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleIncidentUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('Incident updated')
    }

    const handleNewIncident = () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      toast.success('New incident created')
    }

    socket.on('incident:updated', handleIncidentUpdate)
    socket.on('incident:created', handleNewIncident)
    socket.on('incident:commented', handleIncidentUpdate)

    return () => {
      socket.off('incident:updated', handleIncidentUpdate)
      socket.off('incident:created', handleNewIncident)
      socket.off('incident:commented', handleIncidentUpdate)
    }
  }, [socket, queryClient])

  const getIncidentsByStatus = () => {
    if (!incidents) return { open: [], inProgress: [], completed: [], escalated: [] }
    
    return {
      open: incidents.filter(i => i.status === 'open'),
      inProgress: incidents.filter(i => i.status === 'in_progress'),
      completed: incidents.filter(i => i.status === 'completed'),
      escalated: incidents.filter(i => i.status === 'escalated'),
    }
  }

  const incidentsByStatus = getIncidentsByStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.client?.name || 'Client'} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Incident</span>
              </button>
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open</p>
                    <p className="text-2xl font-semibold text-gray-900">{incidentsByStatus.open.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">{incidentsByStatus.inProgress.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{incidentsByStatus.completed.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <ArrowUp className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Escalated</p>
                    <p className="text-2xl font-semibold text-gray-900">{incidentsByStatus.escalated.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex space-x-2">
                {['all', 'open', 'in_progress', 'completed', 'escalated'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Incidents List */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Incidents</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {incidentsLoading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading incidents...</p>
                  </div>
                ) : incidents && incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))
                ) : (                  <div className="p-6 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {statusFilter === 'all' 
                        ? 'No incidents have been created yet.' 
                        : `No ${statusFilter.replace('_', ' ')} incidents found.`}
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4 btn-primary"
                    >
                      Create your first incident
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed Sidebar */}
          <div className="lg:col-span-1">
            <ActivityFeed incidents={incidents || []} />
          </div>
        </div>
      </div>

      {/* Create Incident Modal */}
      {isCreateModalOpen && user?.client && (
        <CreateIncidentModal
          client={user.client}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onIncidentCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['incidents'] })
            setIsCreateModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
