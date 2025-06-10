
import React from 'react';

interface CategoryHeaderProps {
  currentCategoryName: string;
  productCount: number;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({ 
  currentCategoryName, 
  productCount
}) => {
  return (
    <div className="bg-white px-3 py-2 border-b shadow-sm">
      <div className="flex items-center">
        <span className="text-sm font-medium">{currentCategoryName}</span>
        <span className="text-xs text-gray-500 mx-2">({productCount})</span>
      </div>
    </div>
  );
};

export default CategoryHeader;
