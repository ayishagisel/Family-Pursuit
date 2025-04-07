import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  adminOnly?: boolean;
}

/**
 * A protected route component that checks if the user is authenticated
 * and redirects to the login page if not
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  adminOnly = false,
  ...rest 
}) => {
  const { user, isAuthenticated } = useAuthContext();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      setLocation('/login');
      return;
    }
    
    // If adminOnly and user is not admin, redirect to unauthorized
    if (adminOnly && user?.role !== 'admin') {
      setLocation('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, adminOnly, setLocation]);
  
  // Show loading state while checking auth
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If adminOnly, check if user is admin
  if (adminOnly && user?.role !== 'admin') {
    return null;
  }
  
  // Render the protected component
  return <Component {...rest} />;
};

export default ProtectedRoute;