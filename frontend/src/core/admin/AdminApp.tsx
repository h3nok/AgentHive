import React, { useEffect } from 'react';
import AdminDashboard from '@/features/admin/AdminDashboard';

interface AdminAppProps {
  toggleTheme?: () => void;
  mode?: 'light' | 'dark';
}

const AdminApp: React.FC<AdminAppProps> = () => {
  // Add admin-page class to body when admin app is mounted
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);

  return <AdminDashboard />;
};

export default AdminApp;