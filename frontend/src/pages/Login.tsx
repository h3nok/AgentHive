import React, { useEffect, useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../utils/authConfig'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import '../components/Authwrapper/Authwrapper.css'
import LogoText from '../components/LogoText'
import Button from '@mui/material/Button'
import { CardHeader } from '@mui/material'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const isAuthDisabled = import.meta.env.VITE_AUTH_ENABLED === 'false';

const Login: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal()
  const location = useLocation()
  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
  const navigate = useNavigate()

  const [checkingSSO, setCheckingSSO] = useState(true)

  // Skip auth if disabled
  useEffect(() => {
    if (isAuthDisabled) {
      navigate(fromPath, { replace: true });
      return;
    }

    // Attempt silent SSO once on mount
    (async () => {
      try {
        const result = await instance.ssoSilent({ ...loginRequest })
        if (result) {
          instance.setActiveAccount(result.account)
          navigate(fromPath, { replace: true })
          return
        }
      } catch {
        // ignore errors; user will see login UI
      }
      setCheckingSSO(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If auth is disabled or we already have an account, redirect to the target page
  if (isAuthDisabled || accounts.length > 0) {
    return <Navigate to={fromPath} replace />
  }

  const handleLogin = () => {
    if (isAuthDisabled) {
      navigate(fromPath, { replace: true });
      return;
    }
    
    instance.loginRedirect({
      ...loginRequest,
      state: fromPath,
      prompt: 'select_account',
      redirectStartPage: window.location.href,
    })
  }

  // Show spinner during silent SSO check or redirect handling
  if (checkingSSO || inProgress === 'login' || inProgress === 'handleRedirect') {
    return (
      <Box sx={{ position:'relative', height:'100vh', width:'100%', display:'flex', justifyContent:'center', alignItems:'center', bgcolor: theme => theme.palette.mode==='dark' ? '#0d0d0d' : '#fafafa' }}>
        <CircularProgress color="primary" size={64} />
      </Box>
    )
  }

  return (
    <div>
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh',
        bgcolor: theme => theme.palette.mode === 'dark' ? '#0d0d0d' : '#fafafa',
        px: 2,
        '& img.tsc-brand': {
          position: 'absolute',
          top: { xs: 12, sm: 24 },
          left: { xs: 12, sm: 24 },
          height: { xs: 32, sm: 40 },
          opacity: 0.7,
          filter: 'brightness(0.9)',
          zIndex: 0,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg,#b71c1c 0%,#e53935 25%,#ff6f3c 50%,#e53935 75%,#b71c1c 100%)',
          backgroundSize: '400% 400%',
          filter: 'blur(120px)',
          opacity: 0.25,
          zIndex: -3,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          zIndex: -2,
          mixBlendMode: 'overlay'
        }
      }}>
        <CardHeader className="items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <img src="/tsc_logo.svg" alt="Tractor Supply Logo" className="tsc-brand" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tractor Supply Company</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            maxWidth: 420,
            width: '100%',
            backdropFilter: 'blur(10px)',
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.55)' : 'rgba(255,255,255,0.65)',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            boxShadow: theme => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)'
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexDirection: 'column', alignItems: 'center' }}>
            <Box>
              <LogoText size="large" showOnlyBubble={false} animated={false} interactive={false} />
            </Box>
          </Box>
          <Typography
            variant="subtitle2"
            mb={4}
            sx={{
              background: 'linear-gradient(90deg,#c8102e 0%, #ff4b2b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 600,
            }}
          >
            Tractor's multi-agent platform – delivering cutting-edge enterprise intelligence
          </Typography>
          <div>
            <Button
              fullWidth
              size="large"
              onClick={handleLogin}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
                borderRadius: 3,
                background: 'linear-gradient(90deg,#b71c1c 0%, #e53935 100%)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  background: 'linear-gradient(90deg,#c62828 0%, #f44336 100%)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                }
              }}
            >
              Sign In
            </Button>
          </div>
        </Paper>
      </Box>
    </div>
  )
}

export default Login  