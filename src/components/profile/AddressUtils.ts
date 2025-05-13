
import { Address } from '@/services/addressService';

/**
 * Helper functions for working with addresses
 */
export const AddressUtils = {
  /**
   * Formats an address for display
   */
  formatAddressForDisplay(address: Address): string {
    const parts = [
      `${address.logradouro}, ${address.numero}`,
      address.complemento ? address.complemento : null,
      address.bairro,
      `${address.cidade} - ${address.estado}`,
      `CEP: ${address.cep}`
    ].filter(Boolean);
    
    return parts.join(', ');
  },
  
  /**
   * Formats an address as a single line summary
   */
  formatAddressSummary(address: Address): string {
    return `${address.logradouro}, ${address.numero}, ${address.bairro}, ${address.cidade} - ${address.estado}`;
  }
};
