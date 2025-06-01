
import React from 'react';
import { Route } from 'react-router-dom';
import {
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  ForgotPasswordScreen
} from './RouteImports';

const PublicRoutes: React.FC = () => {
  return [
    <Route key="login" path="/login" element={<LoginScreen />} />,
    <Route key="signup" path="/signup" element={<SignUpScreen />} />,
    <Route key="forgot" path="/recuperar-senha" element={<ForgotPasswordScreen />} />,
    <Route key="onboarding" path="/onboarding" element={<OnboardingScreen />} />
  ];
};

export default PublicRoutes;
