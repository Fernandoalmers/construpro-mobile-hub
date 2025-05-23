
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
  onSegmentIdChange?: (id: string | null) => void; // Accept null for cases where segment is cleared
  initialSegmentId?: string | null; // Accept null for cases where there's no initial segment
}

const ProductSegmentSelect: React.FC<ProductSegmentSelectProps> = ({ 
  value, 
  onChange,
  error,
  required = false,
  onSegmentIdChange,
  initialSegmentId
}) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSegments = async () => {
      try {
        // Fetch segments from the product_segments table
        const { data, error } = await supabase
          .from('product_segments')
          .select('id, nome')
          .order('nome');
        
        if (error) {
          console.error('Error loading segments:', error);
          return;
        }
        
        setSegments(data || []);

        // If we have an initialSegmentId, find the corresponding segment name
        if (initialSegmentId && !value) {
          const segment = data?.find(s => s.id === initialSegmentId);
          if (segment) {
            console.log(`Found segment by ID: ${initialSegmentId} -> ${segment.nome}`);
            onChange(segment.nome);
          }
        }
        
        // If we have a value but no initialSegmentId, find the corresponding segment ID
        if (value && !initialSegmentId && onSegmentIdChange) {
          const segment = data?.find(s => s.nome === value);
          if (segment) {
            console.log(`Found segment ID for name: ${value} -> ${segment.id}`);
            onSegmentIdChange(segment.id);
          } else {
            // If we have a value but can't find matching segment, pass null ID
            console.log(`No segment found for name: ${value}, setting ID to null`);
            onSegmentIdChange(null);
          }
        }
      } catch (err) {
        console.error('Error in loadSegments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSegments();
  }, [value, initialSegmentId, onChange, onSegmentIdChange]);
  
  // Handler to update both segment name and optionally send the ID
  const handleSegmentChange = (segmentName: string) => {
    onChange(segmentName);
    
    // If the callback is provided, find the ID for this segment name
    if (onSegmentIdChange) {
      if (segmentName) {
        const selectedSegment = segments.find(s => s.nome === segmentName);
        if (selectedSegment) {
          console.log(`Segment selected: ${segmentName} -> ID: ${selectedSegment.id}`);
          onSegmentIdChange(selectedSegment.id);
        } else {
          // If selected name doesn't match any segment, pass null ID
          console.log(`No segment found for selected name: ${segmentName}, setting ID to null`);
          onSegmentIdChange(null);
        }
      } else {
        // If segment is cleared/empty, pass null ID
        console.log('Segment cleared, setting ID to null');
        onSegmentIdChange(null);
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
