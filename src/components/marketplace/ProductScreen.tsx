
import React from 'react';
import { useParams } from 'react-router-dom';
import ProdutoScreen from './ProdutoScreen';

const ProductScreen: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  
  // Simply forward to the existing ProdutoScreen component
  return <ProdutoScreen />;
};

export default ProductScreen;
