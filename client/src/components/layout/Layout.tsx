import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/use-auth';
import AppSidebar from './AppSidebar';
import AppTopBar from './AppTopBar';
import MobileNav from './MobileNav';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Hide sidebar/topbar on public pages or when not authenticated
  const isPublicRoute = location === '/' || location.startsWith('/auth');
  const showNav = !!user && !isPublicRoute;

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarExpanded(false);
  }, [location]);

  if (!showNav) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* Sidebar — desktop only */}
      <AppSidebar
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      {/* Main area: topbar + content */}
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: 0 }}
      >
        <AppTopBar
          onMenuClick={() => setSidebarExpanded(!sidebarExpanded)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[hsl(var(--background))]">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
};

export default Layout;
