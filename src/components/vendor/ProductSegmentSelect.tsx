
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Segment {
  id: string;
  nome: string;
}

interface ProductSegmentSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  onSegmentIdChange?: (id: string) => void; // Optional callback to get the segment ID
}

const ProductSegmentSelect: React.FC<ProductSegmentSelectProps> = ({ 
  value, 
  onChange,
  error,
  required = false,
  onSegmentIdChange
}) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSegments = async () => {
      try {
        // Busca segmentos da tabela product_segments
        const { data, error } = await supabase
          .from('product_segments')
          .select('id, nome')
          .order('nome');
        
        if (error) {
          console.error('Error loading segments:', error);
          return;
        }
        
        setSegments(data || []);
      } catch (err) {
        console.error('Error in loadSegments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSegments();
  }, []);
  
  // Handler to update both segment name and optionally send the ID
  const handleSegmentChange = (segmentName: string) => {
    onChange(segmentName);
    
    // If the callback is provided, find the ID for this segment name
    if (onSegmentIdChange && segmentName) {
      const selectedSegment = segments.find(s => s.nome === segmentName);
      if (selectedSegment) {
        onSegmentIdChange(selectedSegment.id);
      }
    }
  };

  return (
    <div>
      <Select
        onValueChange={handleSegmentChange}
        value={value || ''}
        disabled={loading}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={loading ? "Carregando segmentos..." : "Selecione um segmento"} />
        </SelectTrigger>
        <SelectContent>
          {segments.map((segment) => (
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
