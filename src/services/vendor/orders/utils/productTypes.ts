
// Define product-related types in a dedicated file

// Simple interface for product ID
export interface ProductId {
  id: string;
}

// Define a simple type for product images without circular references
export type ProductImageType = string[] | null;

// Define a standalone product type with no circular references
export interface ProductData {
  id: string;
  nome: string;
  descricao: string | null;
  preco_normal: number;
  imagens: ProductImageType;
}

// Raw product data from database
export interface RawProductData {
  id: string;
  nome: string;
  descricao: string | null;
  preco_normal: number;
  imagens: unknown;
}
