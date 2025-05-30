
export const createLookupMaps = (
  allOrderItems: any[],
  allProducts: any[],
  allVendors: any[],
  allProfiles: any[]
) => {
  // Create lookup maps
  const itemsByOrderId = new Map();
  (allOrderItems || []).forEach(item => {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }
    itemsByOrderId.get(item.order_id).push(item);
  });

  const productsMap = new Map((allProducts || []).map(p => [p.id, p]));
  const vendorsMap = new Map((allVendors || []).map(v => [v.id, v]));
  const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));

  return {
    itemsByOrderId,
    productsMap,
    vendorsMap,
    profilesMap
  };
};
