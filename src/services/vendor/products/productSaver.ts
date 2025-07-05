
import { supabase } from '@/integrations/supabase/client';
import { VendorProduct, VendorProductInput } from './types';

/**
 * Save a vendor product (create new or update existing)
 */
export const saveVendorProduct = async (productData: VendorProductInput): Promise<VendorProduct | null> => {
  try {
    console.log('[productSaver] Starting saveVendorProduct with data:', {
      ...productData,
      imagens: `Array with ${productData.imagens?.length || 0} images`
    });
    
    // Enhanced input validation
    if (!productData || typeof productData !== 'object') {
      throw new Error('Dados do produto são obrigatórios');
    }
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[productSaver] Auth error:', authError);
      throw new Error('Erro de autenticação: ' + authError.message);
    }
    
    if (!user) {
      console.error('[productSaver] No authenticated user found');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // Get the vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendor) {
      console.error('[productSaver] Error getting vendor ID:', vendorError);
      console.error('[productSaver] Vendor query result:', { vendor, user_id: user.id });
      throw new Error('Perfil de vendedor não encontrado');
    }
    
    console.log('[productSaver] Vendor found:', vendor.id);
    
    const isUpdate = !!productData.id;
    console.log(`[productSaver] ${isUpdate ? 'Updating' : 'Creating'} product for vendor ID:`, vendor.id);
    
    // Enhanced validation of required fields
    if (!productData.nome || productData.nome.trim() === '') {
      console.error('[productSaver] Missing nome field');
      throw new Error('Nome do produto é obrigatório');
    }
    
    if (!productData.descricao || productData.descricao.trim() === '') {
      console.error('[productSaver] Missing descricao field');
      throw new Error('Descrição do produto é obrigatória');
    }
    
    if (!productData.categoria || productData.categoria.trim() === '') {
      console.error('[productSaver] Missing categoria field');
      throw new Error('Categoria do produto é obrigatória');
    }
    
    if (!productData.segmento || productData.segmento.trim() === '') {
      console.error('[productSaver] Missing segmento field');
      throw new Error('Segmento do produto é obrigatório');
    }
    
    if (!productData.preco_normal || productData.preco_normal <= 0) {
      console.error('[productSaver] Invalid preco_normal:', productData.preco_normal);
      throw new Error('Preço deve ser maior que zero');
    }
    
    // Validate and clean unit of measurement with normalization
    const normalizeUnit = (unit: string): string => {
      const unitMap: { [key: string]: string } = {
        'Metro quadrado (m²)': 'm2',
        'm²': 'm2',
        'metro_quadrado': 'm2',
        'metro quadrado': 'm2',
        'Litro': 'litro',
        'Quilograma (kg)': 'kg',
        'kg': 'kg',
        'Caixa': 'caixa',
        'Pacote': 'pacote',
        'Barra': 'barra',
        'Saco': 'saco',
        'Rolo': 'rolo',
        'Unidade': 'unidade'
      };
      
      return unitMap[unit] || unit.toLowerCase();
    };
    
    const unidadeMedida = normalizeUnit(productData.unidade_medida || 'unidade');
    console.log('[productSaver] Normalized unit:', { original: productData.unidade_medida, normalized: unidadeMedida });
    
    // Validate required conversion values for specific units
    const unitsRequiringConversion = ['m2', 'litro', 'kg', 'barra', 'saco', 'rolo'];
    if (unitsRequiringConversion.includes(unidadeMedida)) {
      if (!productData.valor_conversao || productData.valor_conversao <= 0) {
        const unitLabels: { [key: string]: string } = {
          'm2': 'área por caixa (m²)',
          'litro': 'volume por embalagem (litros)',
          'kg': 'peso por embalagem (kg)',
          'barra': 'comprimento por barra (metros)',
          'saco': 'peso por saco (kg)',
          'rolo': 'metragem por rolo (metros)'
        };
        console.error('[productSaver] Missing valor_conversao for unit:', unidadeMedida);
        throw new Error(`Para produtos vendidos em ${unidadeMedida}, é obrigatório informar ${unitLabels[unidadeMedida]}`);
      }
      console.log('[productSaver] Conversion validation passed for unit:', unidadeMedida, 'valor_conversao:', productData.valor_conversao);
    }
    
    // Validate stock (allow decimal values)
    const estoque = Math.max(0, Number(productData.estoque) || 0);
    
    // FIXED: Properly handle images array - save as proper JSON array, not escaped string
    let imagensArray: string[] = [];
    if (productData.imagens && Array.isArray(productData.imagens)) {
      // Filter out empty strings, blob URLs, and invalid URLs
      imagensArray = productData.imagens.filter(img => 
        img && 
        typeof img === 'string' && 
        img.trim() !== '' && 
        !img.startsWith('blob:') &&
        (img.startsWith('http') || img.startsWith('/'))
      );
      
      console.log('[productSaver] Filtered valid images:', imagensArray);
    }
    
    // Validate SKU and barcode uniqueness (only if updating, exclude current product)
    await validateProductUniqueness(productData);
    
    // Process promotion dates with better validation
    let promocaoInicio = null;
    let promocaoFim = null;
    
    if (productData.promocao_ativa) {
      console.log('[productSaver] Processing promotion data:', {
        ativa: productData.promocao_ativa,
        inicio: productData.promocao_inicio,
        fim: productData.promocao_fim,
        preco_promocional: productData.preco_promocional
      });
      
      // Validate promotion fields
      if (!productData.preco_promocional || productData.preco_promocional <= 0) {
        throw new Error('Preço promocional deve ser maior que zero');
      }
      
      if (productData.preco_promocional >= productData.preco_normal) {
        throw new Error('Preço promocional deve ser menor que o preço normal');
      }
      
      if (!productData.promocao_inicio || !productData.promocao_fim) {
        throw new Error('Datas de início e fim da promoção são obrigatórias');
      }
      
      try {
        promocaoInicio = new Date(productData.promocao_inicio).toISOString();
        promocaoFim = new Date(productData.promocao_fim).toISOString();
        
        // Validate date logic
        if (new Date(promocaoInicio) >= new Date(promocaoFim)) {
          throw new Error('Data de fim deve ser posterior à data de início');
        }
        
        console.log('[productSaver] Processed promotion dates:', {
          inicio: promocaoInicio,
          fim: promocaoFim
        });
      } catch (dateError) {
        console.error('[productSaver] Error processing promotion dates:', dateError);
        throw new Error('Formato de data inválido para promoção');
      }
    }
    
    // Auto-set controle_quantidade based on unit type
    let controleQuantidade = productData.controle_quantidade || 'livre';
    if (['m2', 'barra', 'rolo'].includes(unidadeMedida)) {
      controleQuantidade = 'multiplo';
      console.log('[productSaver] Auto-set controle_quantidade to multiplo for unit:', unidadeMedida);
    }
    
    // Prepare data for insert/update with proper field mapping and validation
    const dbData = {
      nome: productData.nome.trim(),
      descricao: productData.descricao.trim(),
      categoria: productData.categoria.trim(),
      segmento: productData.segmento.trim(),
      preco_normal: productData.preco_normal,
      estoque,
      vendedor_id: vendor.id,
      // When updating, set status to 'pendente' to require re-approval
      status: isUpdate ? 'pendente' as const : 'pendente' as const,
      updated_at: new Date().toISOString(),
      // FIXED: Store as proper JSON array (not escaped string)
      imagens: imagensArray, // Direct array, not stringified
      // Clean and format SKU and barcode
      sku: productData.sku?.trim() || null,
      codigo_barras: productData.codigo_barras?.trim() || null,
      // Process promotion fields
      promocao_ativa: productData.promocao_ativa || false,
      preco_promocional: productData.promocao_ativa ? productData.preco_promocional : null,
      promocao_inicio: promocaoInicio,
      promocao_fim: promocaoFim,
      // Points mapping with defaults
      pontos_consumidor: productData.pontos_consumidor || 0,
      pontos_profissional: productData.pontos_profissional || 0,
      // Unit and measurement fields with validation
      unidade_medida: unidadeMedida,
      valor_conversao: productData.valor_conversao || null,
      controle_quantidade: controleQuantidade,
      // Segment mapping
      segmento_id: productData.segmento_id || null
    };
    
    console.log('[productSaver] Database data to save:', {
      ...dbData,
      imagens: `Array with ${imagensArray.length} images:`,
      imagensArray
    });
    
    // Remove id when creating a new product
    if (!isUpdate) {
      delete (dbData as any).id;
    }
    
    // Insert new or update existing product
    let result;
    if (isUpdate) {
      console.log('[productSaver] Updating product with ID:', productData.id);
      console.log('[productSaver] Update data being sent to Supabase:', JSON.stringify(dbData, null, 2));
      result = await supabase
        .from('produtos')
        .update(dbData)
        .eq('id', productData.id)
        .select()
        .single();
    } else {
      console.log('[productSaver] Creating new product');
      console.log('[productSaver] Insert data being sent to Supabase:', JSON.stringify(dbData, null, 2));
      result = await supabase
        .from('produtos')
        .insert(dbData)
        .select()
        .single();
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('[productSaver] Database error:', error);
      console.error('[productSaver] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Handle specific database errors with user-friendly messages
      if (error.code === '23505') {
        if (error.message.includes('sku')) {
          throw new Error('SKU já existe no sistema. Escolha um SKU único.');
        }
        if (error.message.includes('codigo_barras')) {
          throw new Error('Código de barras já existe no sistema. Escolha um código único.');
        }
        throw new Error('Dados duplicados encontrados. Verifique SKU e código de barras.');
      }
      
      if (error.code === '23503') {
        if (error.message.includes('vendedor_id')) {
          throw new Error('Perfil de vendedor não encontrado. Faça login novamente.');
        }
        throw new Error('Erro de referência: verifique se categoria e segmento existem.');
      }
      
      if (error.code === '23514') {
        throw new Error('Dados inválidos: verifique preços e quantidades.');
      }
      
      if (error.code === '23502') {
        // NOT NULL violation - identify specific field
        const field = error.message.includes('nome') ? 'nome' :
                     error.message.includes('categoria') ? 'categoria' :
                     error.message.includes('segmento') ? 'segmento' :
                     error.message.includes('preco_normal') ? 'preço' :
                     error.message.includes('vendedor_id') ? 'vendedor' : 'campo obrigatório';
        throw new Error(`${field} é obrigatório e não pode estar vazio.`);
      }
      
      if (error.code === '42501') {
        throw new Error('Permissão negada. Verifique se você tem acesso de vendedor.');
      }
      
      // Generic database error with more context
      throw new Error(`Erro no banco de dados (${error.code || 'UNKNOWN'}): ${error.message || 'Erro desconhecido'}`);
    }
    
    if (!data) {
      throw new Error('Nenhum dado retornado após salvamento');
    }
    
    console.log(`[productSaver] Product ${isUpdate ? 'updated' : 'created'} successfully:`, data);
    
    // FIXED: Return images as proper array
    let returnedImages = [];
    if (data.imagens) {
      if (Array.isArray(data.imagens)) {
        // Already an array - use as is
        returnedImages = data.imagens;
      } else if (typeof data.imagens === 'string') {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(data.imagens);
          returnedImages = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.warn('[productSaver] Error parsing returned images:', e);
          returnedImages = [];
        }
      }
    }
    
    console.log('[productSaver] Final returned images:', returnedImages);
    
    return {
      ...data,
      imagens: returnedImages
    } as VendorProduct;
    
  } catch (error) {
    console.error('[productSaver] Error in saveVendorProduct:', error);
    throw error;
  }
};

/**
 * Validate SKU and barcode uniqueness
 */
const validateProductUniqueness = async (productData: VendorProductInput): Promise<void> => {
  // Validate SKU uniqueness if provided
  if (productData.sku && productData.sku.trim()) {
    const { data: existingSku, error: skuError } = await supabase
      .from('produtos')
      .select('id')
      .eq('sku', productData.sku.trim())
      .neq('id', productData.id || '00000000-0000-0000-0000-000000000000')
      .maybeSingle();
    
    if (skuError && skuError.code !== 'PGRST116') {
      console.error('[productSaver] Error checking SKU uniqueness:', skuError);
      throw new Error('Erro ao validar SKU único.');
    }
    
    if (existingSku) {
      throw new Error('SKU já existe no sistema. Escolha um SKU único.');
    }
  }
  
  // Validate barcode uniqueness if provided
  if (productData.codigo_barras && productData.codigo_barras.trim()) {
    const { data: existingBarcode, error: barcodeError } = await supabase
      .from('produtos')
      .select('id')
      .eq('codigo_barras', productData.codigo_barras.trim())
      .neq('id', productData.id || '00000000-0000-0000-0000-000000000000')
      .maybeSingle();
    
    if (barcodeError && barcodeError.code !== 'PGRST116') {
      console.error('[productSaver] Error checking barcode uniqueness:', barcodeError);
      throw new Error('Erro ao validar código de barras único.');
    }
    
    if (existingBarcode) {
      throw new Error('Código de barras já existe no sistema. Escolha um código único.');
    }
  }
};
