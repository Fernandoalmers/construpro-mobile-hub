
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingState from '@/components/common/LoadingState';
import {
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  ForgotPasswordScreen
} from './LazyRoutes';

// Import the new ResetPasswordScreen component
const ResetPasswordScreen = React.lazy(() => import('@/components/auth/ResetPasswordScreen'));

const PublicRoutes: React.FC = () => {
  return (
    <>
      <Route path="/login" element={
        <Suspense fallback={<LoadingState text="Carregando login..." />}>
          <LoginScreen />
        </Suspense>
      } />
      <Route path="/signup" element={
        <Suspense fallback={<LoadingState text="Carregando cadastro..." />}>
          <SignUpScreen />
        </Suspense>
      } />
      <Route path="/recuperar-senha" element={
        <Suspense fallback={<LoadingState text="Carregando..." />}>
          <ForgotPasswordScreen />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<LoadingState text="Carregando..." />}>
          <ResetPasswordScreen />
        </Suspense>
      } />
      <Route path="/onboarding" element={
        <Suspense fallback={<LoadingState text="Carregando..." />}>
          <OnboardingScreen />
        </Suspense>
      } />
    </>
  );
};

export default PublicRoutes;
