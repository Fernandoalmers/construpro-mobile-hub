
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCheckout } from '@/hooks/checkout/use-checkout';
import LoadingState from '@/components/common/LoadingState';
import DeliveryAddressSection from '@/components/checkout/DeliveryAddressSection';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';
import OrderSummarySection from '@/components/checkout/OrderSummarySection';
import AddressSelectionModal from '@/components/checkout/AddressSelectionModal';
import CheckoutErrorState from '@/components/checkout/CheckoutErrorState';

const CheckoutScreen: React.FC = () => {
  const navigate = useNavigate();
  const checkout = useCheckout();

  if (checkout.isLoading) {
    return <LoadingState text="Carregando informações..." />;
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
        <CheckoutErrorState
          error={checkout.processError}
          attemptCount={checkout.orderAttempts}
          onRetry={checkout.handleRetry}
        />
      )}
      
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Delivery Address */}
          <DeliveryAddressSection
            selectedAddress={checkout.selectedAddress}
            onChangeAddress={() => checkout.setShowAddressModal(true)}
          />
          
          {/* Payment Method */}
          <PaymentMethodSection
            paymentMethod={checkout.paymentMethod}
            onPaymentMethodChange={checkout.setPaymentMethod}
            changeAmount={checkout.changeAmount}
            onChangeAmountChange={checkout.setChangeAmount}
          />
          
          {/* Order Summary */}
          <OrderSummarySection
            storeGroups={checkout.storeGroups}
            subtotal={checkout.subtotal}
            shipping={checkout.shipping}
            total={checkout.total}
            totalPoints={checkout.totalPoints}
            isSubmitting={checkout.isSubmitting}
            onPlaceOrder={checkout.handlePlaceOrder}
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
        onAddNewAddress={checkout.addNewAddress}
      />
    </div>
  );
};

export default CheckoutScreen;
