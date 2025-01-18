import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NetxelLoader } from './NetxelLoader';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return <NetxelLoader fullScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
