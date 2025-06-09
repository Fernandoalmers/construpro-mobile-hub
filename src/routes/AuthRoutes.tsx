
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../imports';
import LoadingState from '@/components/common/LoadingState';
import {
  ProfileSelectionScreen,
  ProfessionalProfileScreen
} from './LazyRoutes';

const AuthRoutes: React.FC = () => {
  return (
    <>
      <Route path="/auth/profile-selection" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingState text="Carregando..." />}>
            <ProfileSelectionScreen />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/auth/professional-profile" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingState text="Carregando..." />}>
            <ProfessionalProfileScreen />
          </Suspense>
        </ProtectedRoute>
      } />
    </>
  );
};

export default AuthRoutes;
