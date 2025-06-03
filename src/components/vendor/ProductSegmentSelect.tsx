
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
  onSegmentIdChange?: (id: string | null) => void;
  initialSegmentId?: string | null;
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

  console.log('[ProductSegmentSelect] Component rendered with value:', value);
  console.log('[ProductSegmentSelect] Initial segment ID:', initialSegmentId);

  useEffect(() => {
    const loadSegments = async () => {
      try {
        console.log('[ProductSegmentSelect] Loading segments...');
        
        // Fetch segments from the product_segments table
        const { data, error } = await supabase
          .from('product_segments')
          .select('id, nome')
          .eq('status', 'ativo')
          .order('nome');
        
        if (error) {
          console.error('[ProductSegmentSelect] Error loading segments:', error);
          return;
        }
        
        console.log('[ProductSegmentSelect] Segments loaded:', data);
        setSegments(data || []);

        // If we have an initialSegmentId, find the corresponding segment name
        if (initialSegmentId && !value) {
          const segment = data?.find(s => s.id === initialSegmentId);
          if (segment) {
            console.log('[ProductSegmentSelect] Found segment by ID:', initialSegmentId, '->', segment.nome);
            onChange(segment.nome);
            if (onSegmentIdChange) {
              onSegmentIdChange(segment.id);
            }
          }
        }
        
        // If we have a value but no initialSegmentId, find the corresponding segment ID
        if (value && !initialSegmentId && onSegmentIdChange) {
          const segment = data?.find(s => s.nome === value);
          if (segment) {
            console.log('[ProductSegmentSelect] Found segment ID for name:', value, '->', segment.id);
            onSegmentIdChange(segment.id);
          } else {
            console.log('[ProductSegmentSelect] No segment found for name:', value);
            onSegmentIdChange(null);
          }
        }
      } catch (err) {
        console.error('[ProductSegmentSelect] Error in loadSegments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSegments();
  }, [value, initialSegmentId, onChange, onSegmentIdChange]);
  
  // Handler to update both segment name and send the ID
  const handleSegmentChange = (segmentName: string) => {
    console.log('[ProductSegmentSelect] Segment changed to:', segmentName);
    onChange(segmentName);
    
    // Find the ID for this segment name and call the callback
    if (onSegmentIdChange) {
      if (segmentName) {
        const selectedSegment = segments.find(s => s.nome === segmentName);
        if (selectedSegment) {
          console.log('[ProductSegmentSelect] Calling onSegmentIdChange with ID:', selectedSegment.id);
          onSegmentIdChange(selectedSegment.id);
        } else {
          console.log('[ProductSegmentSelect] No segment found for name:', segmentName);
          onSegmentIdChange(null);
        }
      } else {
        console.log('[ProductSegmentSelect] Segment cleared, calling onSegmentIdChange with null');
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
