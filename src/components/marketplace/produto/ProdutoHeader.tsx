
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchHeader from '../components/SearchHeader';
import ProductBreadcrumbs from '../components/ProductBreadcrumbs';

interface ProdutoHeaderProps {
  productName: string;
  productCategory: string;
  productCode?: string;
}

const ProdutoHeader: React.FC<ProdutoHeaderProps> = ({ 
  productName, 
  productCategory, 
  productCode 
}) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate('/marketplace'); // Navigate to marketplace to trigger scroll position restoration
  };

  return (
    <>
      {/* Header with search and cart */}
      <SearchHeader onGoBack={handleGoBack} />

      {/* Breadcrumb navigation */}
      <ProductBreadcrumbs 
        productName={productName} 
        productCategory={productCategory} 
        productCode={productCode}
      />
    </>
  );
};

export default ProdutoHeader;
