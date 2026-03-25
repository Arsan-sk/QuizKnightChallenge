import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { teacherMenu, studentMenu, MenuItem } from '../../config/menuConfig';
import { useProfile } from '../../hooks/use-profile';
import { useAuth } from '../../hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ChevronRight,
  LogOut,
  Shield,
} from 'lucide-react';

type Props = {
  expanded: boolean;
  onExpandedChange: (v: boolean) => void;
};

const AppSidebar: React.FC<Props> = ({ expanded, onExpandedChange }) => {
  const [location, navigate] = useLocation();
  const { profile } = useProfile();
  const { logoutMutation } = useAuth();
  const role = profile?.role === 'teacher' ? 'teacher' : 'student';
  const menu: MenuItem[] = role === 'teacher' ? teacherMenu : studentMenu;

  const mainMenu = menu.filter((m) => m.key !== 'signout');
  const signoutItem = menu.find((m) => m.key === 'signout');

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === '/student' || route === '/teacher') return location === route;
    return location.startsWith(route);
  };

  const handleNav = (item: MenuItem) => {
    if (item.route) navigate(item.route);
  };

  const handleSignOut = () => {
    if (!logoutMutation.isPending) logoutMutation.mutate();
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 240 : 72 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 z-50 overflow-hidden flex-shrink-0',
          'border-r border-[hsl(var(--border))]',
          'bg-[hsl(var(--card))]'
        )}
        onMouseEnter={() => onExpandedChange(true)}
        onMouseLeave={() => onExpandedChange(false)}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[hsl(var(--border))] flex-shrink-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 4px 14px -2px hsl(var(--primary) / 0.5)' }}
          >
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-base tracking-tight text-[hsl(var(--foreground))]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                QuizKTC
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 border-b border-[hsl(var(--border))]"
            >
              <span className="badge-primary text-xs capitalize">{role}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.route);
            const isCta = item.cta;

            const navItem = (
              <motion.button
                key={item.key}
                onClick={() => handleNav(item)}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'nav-item w-full text-left',
                  active && 'active',
                  isCta && !active && 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]',
                )}
                style={{ minHeight: 40 }}
              >
                <span className="flex-shrink-0">
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]',
                      isCta && !active && 'text-[hsl(var(--primary))]'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );

            if (!expanded) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-1">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navItem;
          })}
        </nav>

        {/* Bottom: collapse toggle + sign out */}
        <div className="px-2 py-3 border-t border-[hsl(var(--border))] space-y-1 flex-shrink-0">
          {signoutItem && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleSignOut}
                  disabled={logoutMutation.isPending}
                  whileTap={{ scale: 0.96 }}
                  className="nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  style={{ minHeight: 40 }}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              {!expanded && <TooltipContent side="right">Sign Out</TooltipContent>}
            </Tooltip>
          )}

          {/* Expand/collapse hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onExpandedChange(!expanded)}
                whileTap={{ scale: 0.96 }}
                className="nav-item w-full text-left"
                style={{ minHeight: 40 }}
              >
                <ChevronRight
                  className={cn(
                    'w-5 h-5 flex-shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-300',
                    expanded && 'rotate-180'
                  )}
                />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap"
                    >
                      Collapse sidebar
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right">Expand sidebar</TooltipContent>}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default AppSidebar;
