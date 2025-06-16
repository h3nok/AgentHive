import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrimaryLayout from '../layout/PrimaryLayout';
import CircularProgress from '@mui/material/CircularProgress';

// Lazy pages
const Landing = lazy(() => import('../pages/Landing')); // placeholder
const ChatWorkspace = lazy(() => import('../pages/ChatWorkspace')); // placeholder
const Dashboard = lazy(() => import('../pages/Dashboard')); // placeholder
const Settings = lazy(() => import('../pages/Settings')); // placeholder

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
    <CircularProgress />
  </div>
);

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<PrimaryLayout />}>
          <Route index element={<Landing />} />
          <Route path="chat/*" element={<ChatWorkspace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          {/* Redirect unknowns */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
