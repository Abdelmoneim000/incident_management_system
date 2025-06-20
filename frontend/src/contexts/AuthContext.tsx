import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authService } from '../services/auth'
import { toast } from 'react-hot-toast'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false
      }
    default:
      return state
  }
}

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken()
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      try {
        const { user } = await authService.getCurrentUser()
        dispatch({ type: 'SET_USER', payload: user })
      } catch (error) {
        authService.logout()
        dispatch({ type: 'LOGOUT' })
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const { token, user } = await authService.login(email, password)
      authService.setToken(token)
      dispatch({ type: 'SET_USER', payload: user })
      toast.success('Login successful!')
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false })
      toast.error(error.response?.data?.error || 'Login failed')
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    dispatch({ type: 'LOGOUT' })
    toast.success('Logged out successfully')
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
