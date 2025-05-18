
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-construPro-blue">
      <div className="relative w-32 h-32 mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#F97316" strokeWidth="10" />
            <path d="M30 50L45 65L70 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
          <svg className="w-full h-full opacity-50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#F97316" strokeWidth="10" />
          </svg>
        </div>
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">Matershop</h1>
      <p className="text-construPro-lightgray text-lg">Seu parceiro na construção</p>
    </div>
  );
};

export default SplashScreen;
