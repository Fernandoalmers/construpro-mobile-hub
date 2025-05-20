
import React from 'react';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RedemptionEmptyStateProps {
  title: string;
  description: string;
}

const RedemptionEmptyState: React.FC<RedemptionEmptyStateProps> = ({ title, description }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-construPro-blue/10 rounded-full flex items-center justify-center mb-4">
        <Gift className="h-8 w-8 text-construPro-blue" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      <Button 
        onClick={() => navigate('/rewards')}
        className="bg-construPro-blue hover:bg-construPro-blue/90"
      >
        Explorar Recompensas
      </Button>
    </div>
  );
};

export default RedemptionEmptyState;
