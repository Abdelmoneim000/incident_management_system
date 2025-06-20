import { createContext, useContext, useEffect, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  joinClient: (clientId: string) => void
  joinIncident: (incidentId: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  let socket: Socket | null = null

  useEffect(() => {
    if (isAuthenticated) {
      socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001')
      
      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      return () => {
        socket?.disconnect()
      }
    }
  }, [isAuthenticated])

  const joinClient = (clientId: string) => {
    socket?.emit('join-client', clientId)
  }

  const joinIncident = (incidentId: string) => {
    socket?.emit('join-incident', incidentId)
  }

  const value: SocketContextType = {
    socket,
    joinClient,
    joinIncident
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
