
import React from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../imports';
import {
  ProfileSelectionScreen,
  ProfessionalProfileScreen
} from './RouteImports';

const AuthRoutes: React.FC = () => {
  return (
    <>
      <Route path="/auth/profile-selection" element={
        <ProtectedRoute>
          <ProfileSelectionScreen />
        </ProtectedRoute>
      } />
      <Route path="/auth/professional-profile" element={
        <ProtectedRoute>
          <ProfessionalProfileScreen />
        </ProtectedRoute>
      } />
    </>
  );
};

export default AuthRoutes;
