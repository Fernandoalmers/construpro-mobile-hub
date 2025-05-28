
import React from 'react';
import { Pedido } from '@/services/vendor/orders/pedidosService';

interface OrderPrintTemplateProps {
  pedido: Pedido;
}

const OrderPrintTemplate = React.forwardRef<HTMLDivElement, OrderPrintTemplateProps>(
  ({ pedido }, ref) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const formatAddress = (endereco: any) => {
      if (typeof endereco === 'string') return endereco;
      if (endereco?.logradouro) {
        return `${endereco.logradouro}, ${endereco.numero}, ${endereco.cidade} - ${endereco.estado}`;
      }
      return JSON.stringify(endereco);
    };

    return (
      <div ref={ref} className="p-8 bg-white text-black font-sans max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center">DETALHES DO PEDIDO</h1>
          <div className="text-center mt-2">
            <p className="text-lg">Pedido #{pedido.id.substring(0, 8)}</p>
            <p className="text-sm text-gray-600">Data: {formatDate(pedido.created_at)}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">
            Informações do Cliente
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Nome:</strong> {pedido.cliente?.nome || 'Cliente não identificado'}</p>
              <p><strong>Email:</strong> {pedido.cliente?.email || 'Não informado'}</p>
            </div>
            <div>
              <p><strong>Telefone:</strong> {pedido.cliente?.telefone || 'Não informado'}</p>
              <p><strong>Total gasto:</strong> R$ {Number(pedido.cliente?.total_gasto || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">
            Informações do Pedido
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Status:</strong> {pedido.status}</p>
              <p><strong>Forma de Pagamento:</strong> {pedido.forma_pagamento}</p>
            </div>
            <div>
              <p><strong>Valor Total:</strong> R$ {Number(pedido.valor_total).toFixed(2)}</p>
              {pedido.data_entrega_estimada && (
                <p><strong>Entrega Estimada:</strong> {formatDate(pedido.data_entrega_estimada)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {pedido.endereco_entrega && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">
              Endereço de Entrega
            </h2>
            <p>{formatAddress(pedido.endereco_entrega)}</p>
          </div>
        )}

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-200 pb-1">
            Itens do Pedido
          </h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Produto</th>
                <th className="border border-gray-300 p-2 text-center">Qtd</th>
                <th className="border border-gray-300 p-2 text-right">Preço Unit.</th>
                <th className="border border-gray-300 p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    {item.produto?.nome || 'Produto indisponível'}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {item.quantidade}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    R$ {Number(item.preco_unitario).toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    R$ {Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={3} className="border border-gray-300 p-2 text-right">
                  TOTAL:
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  R$ {Number(pedido.valor_total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-300">
          <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>
    );
  }
);

OrderPrintTemplate.displayName = 'OrderPrintTemplate';

export default OrderPrintTemplate;
