
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface ProductBreadcrumbsProps {
  productName: string;
  productCategory: string;
  productCode?: string;
}

const ProductBreadcrumbs: React.FC<ProductBreadcrumbsProps> = ({ productName, productCategory, productCode }) => {
  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto py-2 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link to="/marketplace" className="hover:underline">
                Marketplace
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight size={16} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <Link to={`/marketplace?categoria=${encodeURIComponent(productCategory)}`} className="hover:underline">
                {productCategory}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight size={16} />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="truncate max-w-[200px] inline-block">
                {productName}
                {productCode && <span className="text-gray-500 text-xs ml-2">({productCode})</span>}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default ProductBreadcrumbs;
