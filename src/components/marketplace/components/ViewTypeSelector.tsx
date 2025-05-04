
import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewTypeSelectorProps {
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
}

const ViewTypeSelector: React.FC<ViewTypeSelectorProps> = ({ viewType, setViewType }) => {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-white rounded-md border border-gray-200 inline-flex">
        <button 
          className={`p-1.5 ${viewType === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
          onClick={() => setViewType('grid')}
          title="Visualização em grade"
        >
          <Grid size={18} />
        </button>
        <button 
          className={`p-1.5 ${viewType === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
          onClick={() => setViewType('list')}
          title="Visualização em lista"
        >
          <List size={18} />
        </button>
      </div>
    </div>
  );
};

export default ViewTypeSelector;
