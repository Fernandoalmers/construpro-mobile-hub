
/**
 * Interface for product image data
 */
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  ordem: number;
  created_at: string;
}
