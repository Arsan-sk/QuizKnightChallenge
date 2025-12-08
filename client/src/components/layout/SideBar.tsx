import React from 'react';
import NavItem from './NavItem';
import { teacherMenu, studentMenu, MenuItem } from '../../config/menuConfig';
import { useProfile } from '../../hooks/use-profile';
import { useAuth } from '../../hooks/use-auth';

type Props = {
  compact?: boolean;
};

const SideBar: React.FC<Props> = ({ compact }) => {
  const { profile } = useProfile();
  const { logoutMutation } = useAuth();
  const role = profile?.role === 'teacher' ? 'teacher' : 'student';
  const menu: MenuItem[] = role === 'teacher' ? teacherMenu : studentMenu;

  const signOut = () => {
    if (!logoutMutation.isPending) logoutMutation.mutate();
  };

  const mainMenu = menu.filter((m) => m.key !== 'signout');
  const signoutItem = menu.find((m) => m.key === 'signout');

  return (
    <aside className={`w-64 bg-white border-r hidden md:flex md:flex-col h-[calc(100vh-56px)] sticky top-14`}>
      <div className="p-4 border-b">
        <div className="text-lg font-bold">QuizKTC</div>
        <div className="text-xs text-gray-500">{role === 'teacher' ? 'Teacher' : 'Student'}</div>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-auto">
        {mainMenu.map((m) => (
          <NavItem key={m.key} title={m.title} route={m.route} Icon={m.icon} cta={m.cta} />
        ))}
      </nav>

      <div className="p-3 border-t">
        {signoutItem ? (
          <NavItem
            key={signoutItem.key}
            title={signoutItem.title}
            Icon={signoutItem.icon}
            onClick={signOut}
            disabled={logoutMutation.isPending}
          />
        ) : null}
      </div>
    </aside>
  );
};

export default SideBar;
