import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '@/src/hooks/useAdmin';

export default function AdminRoute() {
  const { isAdmin, loading } = useAdmin();

  if (loading) return <div className="p-8 text-center font-bold">অ্যাডমিন স্ট্যাটাস চেক করা হচ্ছে...</div>;

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
