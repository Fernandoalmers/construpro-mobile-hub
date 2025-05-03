
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page
    navigate('/home');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-12 h-12 border-4 border-t-construPro-blue rounded-full animate-spin"></div>
    </div>
  );
};

export default Index;
