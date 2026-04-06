import React from 'react';
import { Navigate, Outlet ,useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopHeader } from './TopHeader';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';
interface MainLayoutProps {
  title?: string;
  showSearch?: boolean;
  requiredRole?: UserRole | UserRole[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({ title, showSearch, requiredRole }) => {
  const { isAuthenticated, user , } = useAuth();
const location = useLocation();
 // Cela évite les redirections brutales avant d'avoir les infos du rôle
 // 1. If not authenticated, send to login immediately
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


   // 2. If authenticated but user data hasn't loaded yet (limbo state)
  // This handles the "Object is possibly undefined" error for the logic below
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


 // 3. Role validation
  // At this point, TypeScript knows 'user' is DEFINED (not undefined)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role as UserRole)) {
      // Logic for safe redirection based on role
      let redirectPath: string;
      
      if (user.role === 'employee') {
        redirectPath = '/employee/dashboard';
      } else if (user.role === 'manager') {
        redirectPath = '/manager/dashboard';
      } else if (user.role === 'bid_manager') {
        redirectPath = '/bid/dashboard';
      } else {
        redirectPath = '/login';
      }

      return <Navigate to={redirectPath} replace />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <TopHeader title={title} showSearch={showSearch} />
          <main className="flex-1 p-6 overflow-auto">
            <div className="mx-auto max-w-7xl animate-fade-in">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
