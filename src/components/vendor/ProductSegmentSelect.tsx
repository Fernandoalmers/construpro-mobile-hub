
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';

interface ProductSegmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const ProductSegmentSelect: React.FC<ProductSegmentSelectProps> = ({
  value,
  onChange,
  error,
  required = false,
}) => {
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['productSegments'],
    queryFn: getProductSegments,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  return (
    <div className="w-full">
      <Label htmlFor="segmento" className="block mb-2">
        Segmento {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(value) => {
          onChange(value);
        }}
        disabled={isLoading}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Selecione um segmento" />
        </SelectTrigger>
        <SelectContent>
          {segments.map(segment => (
            <SelectItem key={segment.id} value={segment.nome}>
              {segment.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ProductSegmentSelect;
