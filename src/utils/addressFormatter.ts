
export const formatCompleteAddress = (endereco: any): string => {
  if (!endereco) return 'Endereço não informado';
  
  if (typeof endereco === 'string') {
    return endereco;
  }
  
  const parts = [];
  
  // Logradouro e número
  if (endereco.logradouro) {
    parts.push(endereco.logradouro);
    if (endereco.numero) {
      parts[parts.length - 1] += `, ${endereco.numero}`;
    }
  } else if (endereco.rua) {
    parts.push(endereco.rua);
    if (endereco.numero) {
      parts[parts.length - 1] += `, ${endereco.numero}`;
    }
  }
  
  // Complemento
  if (endereco.complemento) {
    parts.push(endereco.complemento);
  }
  
  // Bairro
  if (endereco.bairro) {
    parts.push(endereco.bairro);
  }
  
  // Cidade e Estado
  const cityState = [];
  if (endereco.cidade) {
    cityState.push(endereco.cidade);
  }
  if (endereco.estado) {
    cityState.push(endereco.estado);
  }
  if (cityState.length > 0) {
    parts.push(cityState.join(' - '));
  }
  
  // CEP
  if (endereco.cep) {
    parts.push(`CEP: ${endereco.cep}`);
  }
  
  return parts.filter(Boolean).join(', ') || 'Endereço não informado';
};
