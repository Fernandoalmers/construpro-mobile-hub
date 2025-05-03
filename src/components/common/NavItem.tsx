
import React from 'react';
import { Link } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center py-2 ${
        isActive ? 'text-construPro-orange' : 'text-gray-500'
      }`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs">{label}</span>
    </Link>
  );
};

export default NavItem;
