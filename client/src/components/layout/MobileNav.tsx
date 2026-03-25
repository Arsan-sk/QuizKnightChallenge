import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useProfile } from '../../hooks/use-profile';
import { teacherMenu, studentMenu } from '../../config/menuConfig';
import { cn } from '@/lib/utils';

const MobileNav: React.FC = () => {
  const [location, navigate] = useLocation();
  const { profile } = useProfile();
  const role = profile?.role === 'teacher' ? 'teacher' : 'student';
  const menu = (role === 'teacher' ? teacherMenu : studentMenu)
    .filter((m) => m.key !== 'signout')
    .slice(0, 5);

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === '/student' || route === '/teacher') return location === route;
    return location.startsWith(route);
  };

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 h-16',
        'flex items-center justify-around px-2',
        'border-t border-[hsl(var(--border))]',
        'bg-[hsl(var(--card)/0.9)] backdrop-blur-xl'
      )}
    >
      {menu.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.route);

        return (
          <button
            key={item.key}
            onClick={() => item.route && navigate(item.route)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative"
          >
            {active && (
              <motion.div
                layoutId="mobile-active"
                className="absolute inset-0 rounded-xl bg-[hsl(var(--primary)/0.12)]"
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            )}
            <Icon
              className={cn(
                'w-5 h-5 relative z-10 transition-colors',
                active
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
              strokeWidth={active ? 2.5 : 2}
            />
            <span
              className={cn(
                'text-[10px] font-medium relative z-10 transition-colors',
                active
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
            >
              {item.title.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
