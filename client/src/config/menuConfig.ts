import { Home, PlusCircle, List, BarChart2, Users, User, LogOut, Search, Trophy, Award } from 'lucide-react';

export type MenuItem = {
  key: string;
  title: string;
  route?: string;
  icon: any;
  cta?: boolean;
  action?: () => void;
};

export const teacherMenu: MenuItem[] = [
  { key: 'dashboard', title: 'Dashboard', route: '/teacher', icon: Home },
  { key: 'create', title: 'Create Quiz', route: '/teacher/quiz/create', icon: PlusCircle, cta: true },
  { key: 'management', title: 'Management', route: '/history', icon: List },
  { key: 'profile', title: 'Profile', route: '/profile', icon: User },
  { key: 'signout', title: 'Sign Out', route: '/signout', icon: LogOut },
];

export const studentMenu: MenuItem[] = [
  { key: 'dashboard', title: 'Dashboard', route: '/student', icon: Home },
  { key: 'browse', title: 'Browse Quizzes', route: '/student/quizzes', icon: Search, cta: true },
  { key: 'achievements', title: 'Achievements', route: '/achievements', icon: Award },
  { key: 'leaderboard', title: 'Leaderboard', route: '/leaderboard', icon: Trophy },
  { key: 'profile', title: 'Profile', route: '/profile', icon: User },
  { key: 'signout', title: 'Sign Out', route: '/signout', icon: LogOut },
];

export default { teacherMenu, studentMenu };
