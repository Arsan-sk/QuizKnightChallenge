import React from 'react';
import SideBar from './SideBar';
import TopBar from './TopBar';
import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/use-auth';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const [location] = useLocation();
  const { user } = useAuth();

  // Hide sidebar on public pages (landing, auth) or when not authenticated
  const isPublicRoute = location === '/' || location.startsWith('/auth');
  const hideSidebar = !user || isPublicRoute;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      {/* content area: sidebar is sticky and handles its own height; main just grows and scrolls */}
      <div className={`flex w-full`}>
        {!hideSidebar && <SideBar />}

        <main className={`flex-1 p-4`}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
