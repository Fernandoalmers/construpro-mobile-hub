
import React from 'react';
import HomeScreen from './HomeScreen';
import { useSegmentPreloader } from '@/hooks/useSegmentPreloader';

const HomeScreenWrapper: React.FC = () => {
  // Precarregar imagens de segmentos no app startup
  useSegmentPreloader();
  
  return <HomeScreen />;
};

export default HomeScreenWrapper;
