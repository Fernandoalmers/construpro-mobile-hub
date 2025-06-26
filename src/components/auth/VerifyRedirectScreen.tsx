
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyRedirectScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Capturar todos os parâmetros da URL
    const params = new URLSearchParams();
    
    // Copiar todos os parâmetros existentes
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Redirecionar para /reset-password mantendo todos os parâmetros
    const redirectUrl = `/reset-password?${params.toString()}`;
    console.log('Redirecting to:', redirectUrl);
    
    navigate(redirectUrl, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default VerifyRedirectScreen;
