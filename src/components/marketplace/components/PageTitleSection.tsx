
import React from 'react';
import { MapPin } from 'lucide-react';

interface PageTitleSectionProps {
  title: string;
  currentCep: string | null;
  hasActiveZones: boolean;
  onChangeCep: () => void;
  showProducts: boolean;
}

const PageTitleSection: React.FC<PageTitleSectionProps> = ({
  title,
  currentCep,
  hasActiveZones,
  onChangeCep,
  showProducts
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          {hasActiveZones && currentCep && (
            <p className="text-xs text-gray-500 mt-1">
              CEP {currentCep.replace(/(\d{5})(\d{3})/, '$1-$2')}
            </p>
          )}
        </div>
        
        {/* Botão Alterar CEP - MOBILE ONLY (Desktop tem no header) */}
        {currentCep && showProducts && (
          <button
            onClick={onChangeCep}
            className="md:hidden flex items-center gap-1 px-2 py-1 text-xs font-medium text-construPro-blue border border-construPro-blue rounded-md hover:bg-blue-50 transition-colors shrink-0"
          >
            <MapPin className="w-3 h-3" />
            Alterar CEP
          </button>
        )}
      </div>
    </div>
  );
};

export default PageTitleSection;
