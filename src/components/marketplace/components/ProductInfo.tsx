
import React from 'react';
import { Product } from '@/services/productService';
import ProductBasicInfo from './ProductBasicInfo';
import ProductPricing from './ProductPricing';
import ProductStock from './ProductStock';
import ProductDeliveryInfo from './ProductDeliveryInfo';

interface ProductInfoProps {
  produto: Product;
  deliveryEstimate: {
    minDays: number;
    maxDays: number;
  };
}

const ProductInfo: React.FC<ProductInfoProps> = ({ produto, deliveryEstimate }) => {
  return (
    <div>
      <ProductBasicInfo produto={produto} />
      <ProductPricing produto={produto} />
      <ProductStock produto={produto} />
      <ProductDeliveryInfo produto={produto} />
    </div>
  );
};

export default ProductInfo;
