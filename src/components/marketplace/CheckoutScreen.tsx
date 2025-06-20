
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCheckout } from '@/hooks/checkout/use-checkout';
import LoadingState from '@/components/common/LoadingState';
import DeliveryAddressSection from '@/components/checkout/DeliveryAddressSection';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';
import OrderSummarySection from '@/components/checkout/OrderSummarySection';
import AddressSelectionModal from '@/components/checkout/AddressSelectionModal';
import CheckoutErrorState from '@/components/checkout/CheckoutErrorState';
import { toast } from '@/components/ui/sonner';
import StockValidationModal from '@/components/checkout/StockValidationModal';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const checkout = useCheckout();

  // Validate stock when component mounts or cart changes
  useEffect(() => {
    if (checkout.cartItems?.length > 0) {
      checkout.validateStock();
    }
  }, [checkout.cartItems?.length]);

  // DEBUGGING: Track all handlePlaceOrder calls to identify source
  const handleCheckout = () => {
    console.log('🚀 [CheckoutScreen] handleCheckout called from BUTTON CLICK', {
      timestamp: new Date().toISOString(),
      selectedAddress: checkout.selectedAddress,
      paymentMethod: checkout.paymentMethod,
      cartItemsLength: checkout.cartItems?.length,
      stackTrace: new Error().stack
    });
    
    if (!checkout.selectedAddress) {
      console.log('❌ [CheckoutScreen] No address selected');
      toast.error("Selecione um endereço de entrega");
      return;
    }
    
    if (checkout.cartItems?.length === 0) {
      console.log('❌ [CheckoutScreen] Empty cart');
      toast.error("Seu carrinho está vazio");
      return;
    }
    
    console.log('✅ [CheckoutScreen] Validation passed, proceeding with order:', {
      address: checkout.selectedAddress,
      paymentMethod: checkout.paymentMethod,
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      total: checkout.total,
      appliedCoupon: checkout.appliedCoupon
    });
    
    checkout.handlePlaceOrder();
  };

  // DEBUGGING: Track payment method changes to see if they trigger handlePlaceOrder
  const handlePaymentMethodChange = (method: any) => {
    console.log('💳 [CheckoutScreen] Payment method change requested:', {
      newMethod: method,
      currentMethod: checkout.paymentMethod,
      timestamp: new Date().toISOString()
    });
    
    checkout.setPaymentMethod(method);
    
    console.log('💳 [CheckoutScreen] Payment method change completed');
  };

  if (checkout.isLoading || checkout.isValidatingStock) {
    return <LoadingState text={checkout.isValidatingStock ? "Verificando estoque..." : "Carregando informações..."} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Finalizar Compra</h1>
      </div>
      
      {/* Show error state if there's a processing error */}
      {checkout.processError && (
        <div className="px-6 pt-4">
          <CheckoutErrorState
            error={checkout.processError}
            attemptCount={checkout.orderAttempts}
            onRetry={checkout.handleRetry}
          />
        </div>
      )}
      
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Delivery Address */}
          <DeliveryAddressSection
            selectedAddress={checkout.selectedAddress}
            onChangeAddress={() => checkout.setShowAddressModal(true)}
          />
          
          {/* Payment Method - PROTECTED with custom handler */}
          <PaymentMethodSection
            paymentMethod={checkout.paymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            changeAmount={checkout.changeAmount}
            onChangeAmountChange={checkout.setChangeAmount}
          />
          
          {/* Order Summary - NEW: Pass delivery data */}
          <OrderSummarySection
            storeGroups={checkout.storeGroups}
            subtotal={checkout.subtotal}
            shipping={checkout.shipping}
            discount={checkout.discount}
            total={checkout.total}
            totalPoints={checkout.totalPoints}
            appliedCoupon={checkout.appliedCoupon}
            isSubmitting={checkout.isSubmitting}
            storeDeliveries={checkout.storeDeliveries}
            isCalculatingDelivery={checkout.isCalculatingDelivery}
            hasRestrictedItems={checkout.hasRestrictedItems}
            onPlaceOrder={handleCheckout}
            onGoBack={() => navigate(-1)}
          />
        </div>
      </div>
      
      {/* Address Selection Modal */}
      <AddressSelectionModal
        open={checkout.showAddressModal}
        onOpenChange={checkout.setShowAddressModal}
        addresses={checkout.addresses}
        onSelectAddress={checkout.selectAddress}
        onAddNewAddress={navigate.bind(null, '/profile/address/add')}
      />
      
      {/* Stock Validation Modal */}
      {checkout.stockValidationResult && (
        <StockValidationModal
          open={checkout.showStockModal}
          onClose={() => checkout.setShowStockModal(false)}
          validationResult={checkout.stockValidationResult}
          onRemoveItems={checkout.handleRemoveInvalidItems}
          onAdjustItems={checkout.handleAdjustItemQuantities}
          onContinue={checkout.handleStockModalContinue}
          isProcessing={checkout.isSubmitting}
        />
      )}
    </div>
  );
};

export default CheckoutScreen;
