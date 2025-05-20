
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RedemptionHeaderProps {
  title: string;
}

const RedemptionHeader: React.FC<RedemptionHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <div className="sticky top-0 bg-white z-10 p-4 flex items-center shadow-sm">
      <button 
        onClick={() => navigate(-1)} 
        className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors" 
        aria-label="Voltar"
      >
        <ArrowLeft className="h-5 w-5 text-gray-700" />
      </button>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
    </div>
  );
};

export default RedemptionHeader;
