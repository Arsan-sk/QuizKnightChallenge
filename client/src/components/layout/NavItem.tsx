import React from 'react';
import { Link, useLocation } from 'wouter';

type Props = {
  title: string;
  route?: string;
  Icon?: any;
  cta?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export const NavItem: React.FC<Props> = ({ title, route, Icon, cta, onClick, disabled }) => {
  const [location] = useLocation();
  const active = route ? location.startsWith(route) : false;

  const base = `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100'}`;
  // Use low-opacity black for active state to match project theme (dark neutral highlight)
  const activeClass = active ? 'bg-black/5 text-black/80 font-semibold' : 'text-gray-700';

  if (onClick) {
    return (
      <button onClick={onClick} disabled={disabled} className={`${base} ${activeClass} w-full text-left`}>
        {Icon ? <Icon className="w-5 h-5" /> : null}
        <span className="text-sm">{title}</span>
        {cta ? <span className="ml-auto inline-block px-2 py-0.5 text-xs bg-indigo-600 text-white rounded">New</span> : null}
      </button>
    );
  }

  return (
    <Link href={route || '#'} className={`${base} ${activeClass}`}>
      {Icon ? <Icon className="w-5 h-5" /> : null}
      <span className="text-sm">{title}</span>
      {cta ? <span className="ml-auto inline-block px-2 py-0.5 text-xs bg-indigo-600 text-white rounded">New</span> : null}
    </Link>
  );
};

export default NavItem;
