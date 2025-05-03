
import React, { ReactNode } from 'react';
import BottomTabNavigator from '@/components/layout/BottomTabNavigator';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <main className="flex-1">
        {children}
      </main>
      <BottomTabNavigator />
    </div>
  );
};

export default MainLayout;
