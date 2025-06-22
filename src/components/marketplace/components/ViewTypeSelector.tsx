
import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewTypeSelectorProps {
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
}

const ViewTypeSelector: React.FC<ViewTypeSelectorProps> = ({ viewType, setViewType }) => {
  return (
    <div className="bg-white/20 rounded-md border border-white/30 inline-flex">
      <button 
        className={`p-1 sm:p-1.5 rounded-l-md transition-colors ${
          viewType === 'grid' 
            ? 'bg-white text-construPro-blue' 
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
        onClick={() => setViewType('grid')}
        title="Visualização em grade"
      >
        <Grid size={16} className="sm:hidden" />
        <Grid size={18} className="hidden sm:block" />
      </button>
      <button 
        className={`p-1 sm:p-1.5 rounded-r-md transition-colors ${
          viewType === 'list' 
            ? 'bg-white text-construPro-blue' 
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
        onClick={() => setViewType('list')}
        title="Visualização em lista"
      >
        <List size={16} className="sm:hidden" />
        <List size={18} className="hidden sm:block" />
      </button>
    </div>
  );
};

export default ViewTypeSelector;
