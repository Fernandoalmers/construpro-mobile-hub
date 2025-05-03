
import { supabase } from "@/integrations/supabase/client";

// Function to populate product categories
export const setupCategories = async () => {
  try {
    // Get all segments first
    const { data: segments, error: segmentsError } = await supabase
      .from('product_segments')
      .select('*');
      
    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError);
      return;
    }
    
    // Define categories by segment
    const categoriesBySegment: Record<string, string[]> = {
      'Materiais de Construção': [
        'Cimento', 'Argamassa', 'Areia', 'Brita', 'Tijolos', 'Blocos',
        'Telhas', 'Madeiras', 'Ferragens', 'Drywall', 'Impermeabilizantes'
      ],
      'Material Elétrico': [
        'Cabos e Fios', 'Disjuntores', 'Tomadas e Interruptores',
        'Lâmpadas', 'Iluminação', 'Quadros de Distribuição', 
        'Canaletas', 'Ferramentas Elétricas'
      ],
      'Vidraçaria': [
        'Vidros Temperados', 'Box para Banheiro', 'Espelhos',
        'Vidros Laminados', 'Vidros Decorativos', 'Ferragens para Vidros'
      ],
      'Marmoraria': [
        'Granitos', 'Mármores', 'Quartzo', 'Pedras Decorativas',
        'Pias e Cubas', 'Soleiras e Peitoris'
      ],
      'Pisos e Revestimentos': [
        'Porcelanatos', 'Cerâmicas', 'Azulejos', 'Pisos Vinílicos',
        'Pisos Laminados', 'Pisos de Madeira', 'Rodapés'
      ],
      'Tintas': [
        'Tintas Látex', 'Tintas Acrílicas', 'Esmaltes', 'Vernizes',
        'Texturas', 'Massas', 'Sprays', 'Acessórios para Pintura'
      ],
      'Hidráulica': [
        'Tubos e Conexões', 'Registros e Válvulas', 'Caixas d\'água',
        'Bombas', 'Acessórios Sanitários', 'Ferramentas Hidráulicas'
      ]
    };
    
    // Add categories for each segment
    for (const segment of segments) {
      const categories = categoriesBySegment[segment.nome];
      if (!categories) continue;
      
      for (const categoryName of categories) {
        // Check if category already exists
        const { data: existingCategory, error: checkError } = await supabase
          .from('product_categories')
          .select('id')
          .eq('nome', categoryName)
          .eq('segmento_id', segment.id)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking category ${categoryName}:`, checkError);
          continue;
        }
        
        // Skip if category already exists
        if (existingCategory) continue;
        
        // Create new category
        const { error: insertError } = await supabase
          .from('product_categories')
          .insert({
            nome: categoryName,
            segmento_id: segment.id
          });
          
        if (insertError) {
          console.error(`Error creating category ${categoryName}:`, insertError);
        }
      }
    }
    
    console.log('Categories setup complete');
  } catch (error) {
    console.error('Error setting up categories:', error);
  }
};

// Uncomment to run this setup
// setupCategories().catch(console.error);
