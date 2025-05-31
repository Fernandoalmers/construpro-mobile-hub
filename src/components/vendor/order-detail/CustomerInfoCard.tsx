
import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CustomerInfo {
  nome: string;
  email?: string;
  telefone?: string;
}

interface CustomerInfoCardProps {
  customer: CustomerInfo;
}

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({ customer }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2 mb-3">
        <User size={16} className="text-gray-600 mt-0.5" />
        <h3 className="font-medium">Informações do Cliente</h3>
      </div>
      <div className="space-y-2 text-sm">
        <p><strong>Nome:</strong> {customer.nome || 'Cliente'}</p>
        {customer.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={14} />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.telefone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} />
            <span>{customer.telefone}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CustomerInfoCard;
