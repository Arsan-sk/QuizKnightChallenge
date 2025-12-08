import React from 'react';
import { useProfile } from '../../hooks/use-profile';
import { Avatar } from '../ui/avatar';

const TopBar: React.FC = () => {
  const { profile } = useProfile();

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="text-lg font-bold">QuizKTC</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 hidden sm:block">{profile?.displayName || profile?.username || ''}</div>
        <div>
          <Avatar name={profile?.displayName || profile?.username || 'User'} />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
