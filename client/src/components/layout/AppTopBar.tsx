import React from 'react';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';
import { useProfile } from '../../hooks/use-profile';
import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Shield, Menu, Coins, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/student': 'Dashboard',
  '/teacher': 'Dashboard',
  '/student/quizzes': 'Browse Quizzes',
  '/profile': 'Profile',
  '/profile/edit': 'Edit Profile',
  '/history': 'Quiz History',
  '/achievements': 'Achievements',
  '/leaderboard': 'Leaderboard',
  '/teacher/quiz/create': 'Create Quiz',
};

function getPageTitle(location: string): string {
  if (PAGE_TITLES[location]) return PAGE_TITLES[location];
  if (location.startsWith('/teacher/monitor/')) return 'Live Monitor';
  if (location.startsWith('/quiz-analytics/')) return 'Quiz Analytics';
  if (location.startsWith('/student/quiz/')) return 'Taking Quiz';
  if (location.startsWith('/quiz-review/')) return 'Review Answers';
  return 'QuizKTC';
}

type Props = {
  onMenuClick: () => void;
};

const AppTopBar: React.FC<Props> = ({ onMenuClick }) => {
  const [location] = useLocation();
  const { profile } = useProfile();
  const { user } = useAuth();
  const pageTitle = getPageTitle(location);

  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
    enabled: !!user,
  });

  const points = (userData as User & { points?: number })?.points ?? 0;

  const getInitials = () => {
    const name = profile?.displayName || profile?.username || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header
      className={cn(
        'h-14 flex-shrink-0 flex items-center justify-between px-4 z-40',
        'sticky top-0',
        'border-b border-[hsl(var(--border))]',
        'bg-[hsl(var(--card)/0.85)] backdrop-blur-xl'
      )}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo (visible on mobile) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            QuizKTC
          </span>
        </div>

        {/* Page title (desktop) */}
        <h1
          className="hidden md:block text-lg font-bold text-[hsl(var(--foreground))]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right: points + avatar */}
      <div className="flex items-center gap-3">
        {/* Points badge */}
        {user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.12)',
              border: '1px solid hsl(var(--accent-h) var(--accent-s) var(--accent-l) / 0.3)',
            }}
          >
            <Coins
              className="w-4 h-4"
              style={{ color: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }}
            />
            <span
              className="text-sm font-bold stat-number"
              style={{ color: 'hsl(var(--accent-h) var(--accent-s) var(--accent-l))' }}
            >
              {points.toLocaleString()}
            </span>
          </motion.div>
        )}

        {/* Avatar */}
        <Link href="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <Avatar className="w-8 h-8 ring-2 ring-[hsl(var(--primary)/0.4)] ring-offset-1 ring-offset-[hsl(var(--background))]">
              <AvatarImage src={profile?.profilePicture || (profile as any)?.profileImage} />
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(270 90% 65%))' }}
              >
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </Link>
      </div>
    </header>
  );
};

export default AppTopBar;
