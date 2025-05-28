
/**
 * Helper function to determine if bottom navigation should be shown
 */
export const shouldShowBottomNavigation = (pathname: string): boolean => {
  return !pathname.startsWith('/admin') && 
         !pathname.includes('/auth/') &&
         pathname !== '/login' &&
         pathname !== '/signup' &&
         pathname !== '/recuperar-senha' &&
         pathname !== '/welcome' &&
         pathname !== '/onboarding' &&
         pathname !== '/splash' &&
         pathname !== '/services';
};
