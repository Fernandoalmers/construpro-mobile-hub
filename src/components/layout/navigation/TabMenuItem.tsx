
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface MenuItemProps {
  name: string;
  icon: JSX.Element;
  path: string;
  tooltip: string;
  isActive: boolean;
  badge?: number;
  onClick: (path: string) => void;
}

const TabMenuItem: React.FC<MenuItemProps> = ({
  name,
  icon,
  path,
  tooltip,
  isActive,
  badge,
  onClick
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "flex flex-col items-center justify-center w-full h-full cursor-pointer px-2", 
            isActive ? "text-construPro-blue" : "text-gray-500"
          )}
          onClick={() => onClick(path)}
        >
          <div className="relative">
            {icon}
            {badge !== undefined && badge > 0 && (
              <div className="absolute -top-2 -right-2 bg-construPro-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {badge}
              </div>
            )}
          </div>
          <span className="text-xs mt-1">{name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TabMenuItem;
