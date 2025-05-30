
export const translatePaymentMethod = (method: string): string => {
  const translations: Record<string, string> = {
    'credit': 'Cartão de Crédito',
    'debit': 'Cartão de Débito',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'cash': 'Dinheiro',
    'transfer': 'Transferência',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito'
  };

  return translations[method?.toLowerCase()] || method || 'Não informado';
};
