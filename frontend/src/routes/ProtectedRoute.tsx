import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Check if authentication is disabled via environment variable
const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';

interface ProtectedRouteProps {
  children: JSX.Element
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  const { instance, inProgress } = useMsal()

  // If auth is disabled, bypass all checks
  if (isAuthDisabled) {
    console.log('Authentication is disabled - bypassing auth check')
    return children
  }

  // Normal auth flow
  if (!isAuthenticated) {
    const accounts = instance.getAllAccounts()
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0])
      // allow rendering children after setting account
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
  }

  // If MSAL is still processing the redirect, wait
  if (inProgress === 'handleRedirect') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return children
}

export default ProtectedRoute 