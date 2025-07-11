
import { createSuccessResponse, createErrorResponse } from '../utils.ts';

export async function handlePost(req: Request, context: any) {
  try {
    const body = await req.json();
    console.log('[address-management] POST request with body:', body);
    
    // Validar dados obrigatórios
    if (!body.nome || !body.cep || !body.logradouro || !body.numero || !body.bairro || !body.cidade || !body.estado) {
      console.error('[address-management] Missing required fields:', body);
      return createErrorResponse('Dados obrigatórios faltando', 400);
    }

    // Limpar CEP (remover formatação)
    const cleanCep = body.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      console.error('[address-management] Invalid CEP format:', cleanCep);
      return createErrorResponse('CEP deve ter 8 dígitos', 400);
    }

    // Preparar dados para salvar
    const addressData = {
      user_id: context.user.id,
      nome: body.nome.trim(),
      cep: cleanCep,
      logradouro: body.logradouro.trim(),
      numero: body.numero.trim(),
      complemento: body.complemento?.trim() || '',
      bairro: body.bairro.trim(),
      cidade: body.cidade.trim(),
      estado: body.estado.trim().toUpperCase(),
      principal: body.principal || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[address-management] Saving address data:', addressData);

    // Verificar se é o primeiro endereço do usuário
    const { data: existingAddresses, error: checkError } = await context.supabase
      .from('user_addresses')
      .select('id')
      .eq('user_id', context.user.id);

    if (checkError) {
      console.error('[address-management] Error checking existing addresses:', checkError);
      return createErrorResponse('Erro ao verificar endereços existentes', 500);
    }

    // Se não há endereços, definir como principal automaticamente
    if (!existingAddresses || existingAddresses.length === 0) {
      addressData.principal = true;
      console.log('[address-management] First address - setting as primary');
    }

    // Se está definindo como principal, desmarcar outros endereços
    if (addressData.principal) {
      console.log('[address-management] Setting other addresses as non-primary');
      const { error: updateError } = await context.supabase
        .from('user_addresses')
        .update({ principal: false, updated_at: new Date().toISOString() })
        .eq('user_id', context.user.id);

      if (updateError) {
        console.error('[address-management] Error updating other addresses:', updateError);
        // Não bloquear o salvamento, apenas logar o erro
      }
    }

    // Salvar o novo endereço
    const { data: savedAddress, error: saveError } = await context.supabase
      .from('user_addresses')
      .insert(addressData)
      .select()
      .single();

    if (saveError) {
      console.error('[address-management] Error saving address:', saveError);
      return createErrorResponse('Erro ao salvar endereço: ' + saveError.message, 500);
    }

    console.log('[address-management] Address saved successfully:', savedAddress.id);

    // Se é endereço principal, atualizar perfil do usuário
    if (addressData.principal) {
      console.log('[address-management] Updating user profile with primary address');
      
      const enderecoCompleto = {
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        complemento: addressData.complemento,
        bairro: addressData.bairro,
        cidade: addressData.cidade,
        estado: addressData.estado,
        cep: addressData.cep
      };

      const { error: profileError } = await context.supabase
        .from('profiles')
        .update({
          endereco_principal: enderecoCompleto,
          updated_at: new Date().toISOString()
        })
        .eq('id', context.user.id);

      if (profileError) {
        console.error('[address-management] Error updating profile:', profileError);
        // Não bloquear o salvamento, mas logar o erro
        console.warn('[address-management] Address saved but profile not updated');
      } else {
        console.log('[address-management] Profile updated with primary address');
      }
    }

    // Retornar endereço salvo
    return createSuccessResponse({ 
      address: savedAddress,
      message: 'Endereço salvo com sucesso!'
    });
    
  } catch (error) {
    console.error('[address-management] Unexpected error in POST:', error);
    return createErrorResponse('Erro interno do servidor: ' + error.message, 500);
  }
}
