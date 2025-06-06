import React, { useEffect, useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../utils/authConfig'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import '../components/Authwrapper/Authwrapper.css'
import LogoText from '../components/LogoText'
import Button from '@mui/material/Button'
import { keyframes } from '@mui/system'
import { motion } from 'framer-motion'
import FloatingAgentIcons from '../components/FloatingAgentIcons'
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

  const bgAnim = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  const dotsAnim = keyframes`
    0% { background-position: 0 0; }
    100% { background-position: -200px 200px; }
  `;

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
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
          animation: `${bgAnim} 20s ease infinite`,
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
          animation: `${dotsAnim} 60s linear infinite`,
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
        <FloatingAgentIcons />
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
          {/** Floating animation */}
          {(() => {
            const float = keyframes`
            0% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
            100% { transform: translateY(0px); }
          `;
            return (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ animation: `${float} 4s ease-in-out infinite` }}>
                  <LogoText size="large" showOnlyBubble={false} />
                </Box>
              </Box>
            );
          })()}
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
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
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
          </motion.div>
        </Paper>
      </Box>
    </motion.div>
  )
}

export default Login  