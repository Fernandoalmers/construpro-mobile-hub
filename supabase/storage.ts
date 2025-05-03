
import { supabase } from "@/integrations/supabase/client";

// Create a bucket for product images if it doesn't exist
export const createProductImagesBucket = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
  
  if (!bucketExists) {
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });
    
    if (error) {
      console.error('Error creating product-images bucket:', error);
    } else {
      console.log('Created product-images bucket:', data);
    }
  }
};

// Initialize storage
export const initializeStorage = async () => {
  await createProductImagesBucket();
};

// Call this on app startup
initializeStorage().catch(console.error);
