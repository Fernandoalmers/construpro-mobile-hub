
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const FavoritesHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-construPro-blue p-6 pt-12">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate('/profile')} className="text-white">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white ml-2">Favoritos</h1>
      </div>
    </div>
  );
};

export default FavoritesHeader;
