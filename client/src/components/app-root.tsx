import React from 'react';
import { ToastProvider } from './ui/toast';

interface AppRootProps {
  children: React.ReactNode;
}

export function AppRoot({ children }: AppRootProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
} 