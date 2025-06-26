
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import LoadingState from '@/components/common/LoadingState';
import {
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
  ForgotPasswordScreen
} from './LazyRoutes';

// Import the new ResetPasswordScreen component and VerifyRedirectScreen
const ResetPasswordScreen = React.lazy(() => import('@/components/auth/ResetPasswordScreen'));
const VerifyRedirectScreen = React.lazy(() => import('@/components/auth/VerifyRedirectScreen'));

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
      <Route path="/verify" element={
        <Suspense fallback={<LoadingState text="Redirecionando..." />}>
          <VerifyRedirectScreen />
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
