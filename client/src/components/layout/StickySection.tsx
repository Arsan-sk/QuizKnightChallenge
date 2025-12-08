import React from 'react';

type Props = {
  children: React.ReactNode;
  /** top offset in pixels (defaults to topbar height 56px) */
  offsetPx?: number;
  className?: string;
};

const StickySection: React.FC<Props> = ({ children, offsetPx = 56, className = '' }) => {
  return (
    <div className={`sticky z-30 ${className}`} style={{ top: `${offsetPx}px` }}>
      {children}
    </div>
  );
};

export default StickySection;
