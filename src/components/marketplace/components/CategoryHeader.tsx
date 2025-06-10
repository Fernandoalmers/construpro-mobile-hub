
import React from 'react';
import ViewTypeSelector from './ViewTypeSelector';

interface CategoryHeaderProps {
  currentCategoryName: string;
  productCount: number;
  viewType: 'grid' | 'list';
  setViewType: (type: 'grid' | 'list') => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ 
  currentCategoryName, 
  productCount,
  viewType,
  setViewType
}) => {
  return (
    <div className="bg-white px-3 py-2 border-b shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium">{currentCategoryName}</span>
          <span className="text-xs text-gray-500 mx-2">({productCount})</span>
        </div>
        
        {/* View Type Selector no lado direito */}
        <ViewTypeSelector 
          viewType={viewType}
          setViewType={setViewType}
        />
      </div>
    </div>
  );
};

export default CategoryHeader;
