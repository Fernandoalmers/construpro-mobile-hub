
import { VendorCustomer } from '../../vendorCustomersService';

export interface PointAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  tipo: string;
  valor: number;
  motivo: string;
  created_at?: string;
  cliente?: VendorCustomer;
}
