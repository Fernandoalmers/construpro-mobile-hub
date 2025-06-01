
import React from 'react';
import { Route } from 'react-router-dom';
import {
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  ForgotPasswordScreen
} from './RouteImports';

const PublicRoutes: React.FC = () => {
  return (
    <>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignUpScreen />} />
      <Route path="/recuperar-senha" element={<ForgotPasswordScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
    </>
  );
};

export default PublicRoutes;
