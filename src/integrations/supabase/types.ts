export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          price_at_add: number
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          price_at_add: number
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          price_at_add?: number
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          is_support: boolean
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_support?: boolean
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_support?: boolean
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_vendedor: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          total_gasto: number | null
          ultimo_pedido: string | null
          updated_at: string | null
          usuario_id: string
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          total_gasto?: number | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          usuario_id: string
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          total_gasto?: number | null
          ultimo_pedido?: string | null
          updated_at?: string | null
          usuario_id?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_vendedor_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_products: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_products_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string | null
          discount_amount: number
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          discount_amount: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_value: number | null
          name: string
          show_in_vitrine: boolean
          starts_at: string | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number | null
          name: string
          show_in_vitrine?: boolean
          starts_at?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_value?: number | null
          name?: string
          show_in_vitrine?: boolean
          starts_at?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          cep_ranges: string[] | null
          created_at: string | null
          delivery_time: string
          ibge_code: string | null
          id: string
          zone_name: string
          zone_type: string
        }
        Insert: {
          cep_ranges?: string[] | null
          created_at?: string | null
          delivery_time: string
          ibge_code?: string | null
          id?: string
          zone_name: string
          zone_type: string
        }
        Update: {
          cep_ranges?: string[] | null
          created_at?: string | null
          delivery_time?: string
          ibge_code?: string | null
          id?: string
          zone_name?: string
          zone_type?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          data_adicionado: string | null
          id: string
          produto_id: string
          user_id: string
        }
        Insert: {
          data_adicionado?: string | null
          id?: string
          produto_id: string
          user_id: string
        }
        Update: {
          data_adicionado?: string | null
          id?: string
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          created_at: string | null
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          total: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          total: number
        }
        Update: {
          created_at?: string | null
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          nome: string
          proprietario_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          proprietario_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          proprietario_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cliente_id: string
          created_at: string | null
          cupom_codigo: string | null
          data_criacao: string | null
          desconto_aplicado: number | null
          endereco_entrega: Json
          forma_pagamento: string
          id: string
          pontos_ganhos: number
          rastreio: string | null
          reference_id: string | null
          status: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          cupom_codigo?: string | null
          data_criacao?: string | null
          desconto_aplicado?: number | null
          endereco_entrega: Json
          forma_pagamento: string
          id?: string
          pontos_ganhos?: number
          rastreio?: string | null
          reference_id?: string | null
          status: string
          updated_at?: string | null
          valor_total: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          cupom_codigo?: string | null
          data_criacao?: string | null
          desconto_aplicado?: number | null
          endereco_entrega?: Json
          forma_pagamento?: string
          id?: string
          pontos_ganhos?: number
          rastreio?: string | null
          reference_id?: string | null
          status?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          created_at: string | null
          cupom_codigo: string | null
          data_entrega_estimada: string | null
          desconto_aplicado: number | null
          endereco_entrega: Json
          forma_pagamento: string
          id: string
          order_id: string | null
          reference_id: string | null
          status: string
          updated_at: string
          usuario_id: string
          valor_total: number
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          cupom_codigo?: string | null
          data_entrega_estimada?: string | null
          desconto_aplicado?: number | null
          endereco_entrega: Json
          forma_pagamento: string
          id?: string
          order_id?: string | null
          reference_id?: string | null
          status?: string
          updated_at?: string
          usuario_id: string
          valor_total: number
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          cupom_codigo?: string | null
          data_entrega_estimada?: string | null
          desconto_aplicado?: number | null
          endereco_entrega?: Json
          forma_pagamento?: string
          id?: string
          order_id?: string | null
          reference_id?: string | null
          status?: string
          updated_at?: string
          usuario_id?: string
          valor_total?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_purchases: {
        Row: {
          cliente_id: string
          created_at: string | null
          data: string | null
          id: string
          itens: Json
          loja_id: string
          loja_nome: string
          numero_nf: string
          pontos: number
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data?: string | null
          id?: string
          itens: Json
          loja_id: string
          loja_nome: string
          numero_nf: string
          pontos?: number
          valor: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data?: string | null
          id?: string
          itens?: Json
          loja_id?: string
          loja_nome?: string
          numero_nf?: string
          pontos?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "physical_purchases_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          created_at: string | null
          data: string | null
          descricao: string
          id: string
          pontos: number
          reference_code: string | null
          referencia_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          descricao: string
          id?: string
          pontos: number
          reference_code?: string | null
          referencia_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: string | null
          descricao?: string
          id?: string
          pontos?: number
          reference_code?: string | null
          referencia_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_ajustados: {
        Row: {
          created_at: string | null
          id: string
          motivo: string
          tipo: string
          usuario_id: string
          valor: number
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          motivo: string
          tipo: string
          usuario_id: string
          valor: number
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          motivo?: string
          tipo?: string
          usuario_id?: string
          valor?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pontos_ajustados_vendedor"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_ajustados_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          nome: string
          segmento_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          segmento_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          segmento_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "product_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          ordem: number
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          ordem?: number
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          ordem?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string | null
          data: string | null
          id: string
          nota: number
          produto_id: string
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          data?: string | null
          id?: string
          nota: number
          produto_id: string
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          data?: string | null
          id?: string
          nota?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_segments: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          nome: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          nome: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          nome?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          avaliacao: number | null
          categoria: string
          codigo_barras: string | null
          created_at: string | null
          descricao: string
          estoque: number
          id: string
          imagem_url: string | null
          loja_id: string
          m2_por_caixa: number | null
          nome: string
          pontos: number | null
          pontos_profissional: number | null
          preco: number
          preco_anterior: number | null
          segmento: string | null
          sku: string | null
          status: string | null
          unidade_venda: string | null
          updated_at: string | null
        }
        Insert: {
          avaliacao?: number | null
          categoria: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao: string
          estoque?: number
          id?: string
          imagem_url?: string | null
          loja_id: string
          m2_por_caixa?: number | null
          nome: string
          pontos?: number | null
          pontos_profissional?: number | null
          preco: number
          preco_anterior?: number | null
          segmento?: string | null
          sku?: string | null
          status?: string | null
          unidade_venda?: string | null
          updated_at?: string | null
        }
        Update: {
          avaliacao?: number | null
          categoria?: string
          codigo_barras?: string | null
          created_at?: string | null
          descricao?: string
          estoque?: number
          id?: string
          imagem_url?: string | null
          loja_id?: string
          m2_por_caixa?: number | null
          nome?: string
          pontos?: number | null
          pontos_profissional?: number | null
          preco?: number
          preco_anterior?: number | null
          segmento?: string | null
          sku?: string | null
          status?: string | null
          unidade_venda?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          categoria: string
          codigo_barras: string | null
          controle_quantidade: string | null
          created_at: string | null
          descricao: string
          estoque: number
          id: string
          imagens: Json | null
          nome: string
          pontos_consumidor: number | null
          pontos_profissional: number | null
          preco_normal: number
          preco_promocional: number | null
          promocao_ativa: boolean | null
          promocao_fim: string | null
          promocao_inicio: string | null
          segmento: string | null
          segmento_id: string | null
          sku: string | null
          status: string
          unidade_medida: string | null
          updated_at: string | null
          valor_conversao: number | null
          vendedor_id: string
        }
        Insert: {
          categoria: string
          codigo_barras?: string | null
          controle_quantidade?: string | null
          created_at?: string | null
          descricao: string
          estoque?: number
          id?: string
          imagens?: Json | null
          nome: string
          pontos_consumidor?: number | null
          pontos_profissional?: number | null
          preco_normal: number
          preco_promocional?: number | null
          promocao_ativa?: boolean | null
          promocao_fim?: string | null
          promocao_inicio?: string | null
          segmento?: string | null
          segmento_id?: string | null
          sku?: string | null
          status?: string
          unidade_medida?: string | null
          updated_at?: string | null
          valor_conversao?: number | null
          vendedor_id: string
        }
        Update: {
          categoria?: string
          codigo_barras?: string | null
          controle_quantidade?: string | null
          created_at?: string | null
          descricao?: string
          estoque?: number
          id?: string
          imagens?: Json | null
          nome?: string
          pontos_consumidor?: number | null
          pontos_profissional?: number | null
          preco_normal?: number
          preco_promocional?: number | null
          promocao_ativa?: boolean | null
          promocao_fim?: string | null
          promocao_inicio?: string | null
          segmento?: string | null
          segmento_id?: string | null
          sku?: string | null
          status?: string
          unidade_medida?: string | null
          updated_at?: string | null
          valor_conversao?: number | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_reviews: {
        Row: {
          cliente_id: string | null
          comentario: string
          data: string
          id: string
          nome_cliente: string
          nota: number
          profissional_id: string | null
          projeto_id: string | null
          servico_realizado: string
        }
        Insert: {
          cliente_id?: string | null
          comentario: string
          data: string
          id?: string
          nome_cliente: string
          nota: number
          profissional_id?: string | null
          projeto_id?: string | null
          servico_realizado: string
        }
        Update: {
          cliente_id?: string | null
          comentario?: string
          data?: string
          id?: string
          nome_cliente?: string
          nota?: number
          profissional_id?: string | null
          projeto_id?: string | null
          servico_realizado?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_reviews_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_reviews_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          area_atuacao: string
          avaliacao: number | null
          cidade: string
          especialidade: string
          especialidades: string[] | null
          estado: string
          foto_perfil: string | null
          id: string
          nome: string
          portfolio: string[] | null
          profile_id: string | null
          servicos_realizados: number | null
          sobre: string
          telefone: string
        }
        Insert: {
          area_atuacao: string
          avaliacao?: number | null
          cidade: string
          especialidade: string
          especialidades?: string[] | null
          estado: string
          foto_perfil?: string | null
          id?: string
          nome: string
          portfolio?: string[] | null
          profile_id?: string | null
          servicos_realizados?: number | null
          sobre: string
          telefone: string
        }
        Update: {
          area_atuacao?: string
          avaliacao?: number | null
          cidade?: string
          especialidade?: string
          especialidades?: string[] | null
          estado?: string
          foto_perfil?: string | null
          id?: string
          nome?: string
          portfolio?: string[] | null
          profile_id?: string | null
          servicos_realizados?: number | null
          sobre?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          cnpj: string | null
          codigo: string | null
          cpf: string | null
          created_at: string
          email: string | null
          endereco_principal: Json | null
          especialidade_profissional: string | null
          favoritos: string[] | null
          historico_navegacao: string[] | null
          id: string
          is_admin: boolean | null
          nome: string | null
          papel: string | null
          saldo_pontos: number | null
          status: string | null
          telefone: string | null
          tipo_perfil: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          cnpj?: string | null
          codigo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_principal?: Json | null
          especialidade_profissional?: string | null
          favoritos?: string[] | null
          historico_navegacao?: string[] | null
          id: string
          is_admin?: boolean | null
          nome?: string | null
          papel?: string | null
          saldo_pontos?: number | null
          status?: string | null
          telefone?: string | null
          tipo_perfil?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          cnpj?: string | null
          codigo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          endereco_principal?: Json | null
          especialidade_profissional?: string | null
          favoritos?: string[] | null
          historico_navegacao?: string[] | null
          id?: string
          is_admin?: boolean | null
          nome?: string | null
          papel?: string | null
          saldo_pontos?: number | null
          status?: string | null
          telefone?: string | null
          tipo_perfil?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          data_upload: string
          descricao: string | null
          id: string
          project_id: string | null
          url: string
        }
        Insert: {
          data_upload: string
          descricao?: string | null
          id?: string
          project_id?: string | null
          url: string
        }
        Update: {
          data_upload?: string
          descricao?: string | null
          id?: string
          project_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_steps: {
        Row: {
          comentario: string | null
          concluido: boolean
          data_conclusao: string | null
          descricao: string
          id: string
          ordem: number
          project_id: string | null
          titulo: string
        }
        Insert: {
          comentario?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          descricao: string
          id?: string
          ordem: number
          project_id?: string | null
          titulo: string
        }
        Update: {
          comentario?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          descricao?: string
          id?: string
          ordem?: number
          project_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          avaliado: boolean
          categoria: string | null
          cliente_id: string | null
          comentarios_finais: string | null
          comentarios_iniciais: string | null
          concluido: boolean
          data_conclusao: string | null
          data_estimada: string
          data_inicio: string
          data_termino: string | null
          descricao: string
          duracao_estimada: number | null
          endereco: string
          especialidade_contraparte: string | null
          foto_contraparte: string | null
          id: string
          nome_contraparte: string
          profissional_id: string | null
          status: string
          titulo: string
          valor: string
        }
        Insert: {
          avaliado?: boolean
          categoria?: string | null
          cliente_id?: string | null
          comentarios_finais?: string | null
          comentarios_iniciais?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          data_estimada: string
          data_inicio: string
          data_termino?: string | null
          descricao: string
          duracao_estimada?: number | null
          endereco: string
          especialidade_contraparte?: string | null
          foto_contraparte?: string | null
          id?: string
          nome_contraparte: string
          profissional_id?: string | null
          status: string
          titulo: string
          valor: string
        }
        Update: {
          avaliado?: boolean
          categoria?: string | null
          cliente_id?: string | null
          comentarios_finais?: string | null
          comentarios_iniciais?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          data_estimada?: string
          data_inicio?: string
          data_termino?: string | null
          descricao?: string
          duracao_estimada?: number | null
          endereco?: string
          especialidade_contraparte?: string | null
          foto_contraparte?: string | null
          id?: string
          nome_contraparte?: string
          profissional_id?: string | null
          status?: string
          titulo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_coupons: {
        Row: {
          coupon_id: string
          created_at: string
          display_order: number
          featured: boolean
          id: string
          updated_at: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          display_order?: number
          featured?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: true
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          data_criacao: string | null
          especialidade_profissional: string
          foto_profissional: string | null
          id: string
          mensagem: string
          nome_profissional: string
          prazo: string
          profissional_id: string | null
          service_request_id: string | null
          status: string
          valor: string
        }
        Insert: {
          data_criacao?: string | null
          especialidade_profissional: string
          foto_profissional?: string | null
          id?: string
          mensagem: string
          nome_profissional: string
          prazo: string
          profissional_id?: string | null
          service_request_id?: string | null
          status?: string
          valor: string
        }
        Update: {
          data_criacao?: string | null
          especialidade_profissional?: string
          foto_profissional?: string | null
          id?: string
          mensagem?: string
          nome_profissional?: string
          prazo?: string
          profissional_id?: string | null
          service_request_id?: string | null
          status?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed: {
        Row: {
          data_visualizacao: string | null
          id: string
          produto_id: string
          user_id: string
        }
        Insert: {
          data_visualizacao?: string | null
          id?: string
          produto_id: string
          user_id: string
        }
        Update: {
          data_visualizacao?: string | null
          id?: string
          produto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          data: string | null
          id: string
          pontos: number
          referred_id: string
          referrer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          id?: string
          pontos?: number
          referred_id: string
          referrer_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          id?: string
          pontos?: number
          referred_id?: string
          referrer_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resgates: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          codigo: string | null
          created_at: string | null
          data: string | null
          descricao: string | null
          estoque: number | null
          id: string
          imagem_url: string | null
          item: string
          pontos: number
          prazo_entrega: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          item: string
          pontos: number
          prazo_entrega?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string | null
          estoque?: number | null
          id?: string
          imagem_url?: string | null
          item?: string
          pontos?: number
          prazo_entrega?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          categoria: string
          cliente_id: string | null
          contato_cliente: string
          data: string | null
          data_criacao: string | null
          descricao: string
          detalhes_cliente: string | null
          endereco: string
          horario: string | null
          id: string
          informacoes_adicionais: string | null
          localizacao: string | null
          nome_cliente: string
          orcamento: string | null
          requisitos: string[] | null
          status: string
          titulo: string
        }
        Insert: {
          categoria: string
          cliente_id?: string | null
          contato_cliente: string
          data?: string | null
          data_criacao?: string | null
          descricao: string
          detalhes_cliente?: string | null
          endereco: string
          horario?: string | null
          id?: string
          informacoes_adicionais?: string | null
          localizacao?: string | null
          nome_cliente: string
          orcamento?: string | null
          requisitos?: string[] | null
          status?: string
          titulo: string
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          contato_cliente?: string
          data?: string | null
          data_criacao?: string | null
          descricao?: string
          detalhes_cliente?: string | null
          endereco?: string
          horario?: string | null
          id?: string
          informacoes_adicionais?: string | null
          localizacao?: string | null
          nome_cliente?: string
          orcamento?: string | null
          requisitos?: string[] | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          favicon_filename: string | null
          favicon_url: string | null
          id: string
          logo_filename: string | null
          logo_url: string | null
          logo_variant_filename: string | null
          logo_variant_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          favicon_filename?: string | null
          favicon_url?: string | null
          id?: string
          logo_filename?: string | null
          logo_url?: string | null
          logo_variant_filename?: string | null
          logo_variant_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          favicon_filename?: string | null
          favicon_url?: string | null
          id?: string
          logo_filename?: string | null
          logo_url?: string | null
          logo_variant_filename?: string | null
          logo_variant_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_reviews: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string | null
          data: string | null
          id: string
          loja_id: string
          nota: number
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          data?: string | null
          id?: string
          loja_id: string
          nota: number
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          data?: string | null
          id?: string
          loja_id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          contato: string | null
          created_at: string
          descricao: string | null
          endereco: Json | null
          id: string
          logo_url: string | null
          nome: string
          operating_hours: Json | null
          owner_id: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          nome: string
          operating_hours?: Json | null
          owner_id?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          descricao?: string | null
          endereco?: Json | null
          id?: string
          logo_url?: string | null
          nome?: string
          operating_hours?: Json | null
          owner_id?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          created_at: string | null
          estado: string
          id: string
          logradouro: string
          nome: string
          numero: string
          principal: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          created_at?: string | null
          estado: string
          id?: string
          logradouro: string
          nome: string
          numero: string
          principal?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          logradouro?: string
          nome?: string
          numero?: string
          principal?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_delivery_context: {
        Row: {
          created_at: string
          current_cep: string
          current_city: string | null
          current_state: string | null
          id: string
          last_resolved_at: string | null
          resolved_zone_ids: string[] | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_cep: string
          current_city?: string | null
          current_state?: string | null
          id?: string
          last_resolved_at?: string | null
          resolved_zone_ids?: string[] | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_cep?: string
          current_city?: string | null
          current_state?: string | null
          id?: string
          last_resolved_at?: string | null
          resolved_zone_ids?: string[] | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          banner: string | null
          created_at: string | null
          descricao: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_latitude: number | null
          endereco_logradouro: string | null
          endereco_longitude: number | null
          endereco_numero: string | null
          formas_entrega: Json | null
          id: string
          logo: string | null
          nome_loja: string
          segmento: string | null
          status: string | null
          telefone: string | null
          updated_at: string | null
          usuario_id: string
          whatsapp: string | null
          zona_entrega: string | null
        }
        Insert: {
          banner?: string | null
          created_at?: string | null
          descricao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_latitude?: number | null
          endereco_logradouro?: string | null
          endereco_longitude?: number | null
          endereco_numero?: string | null
          formas_entrega?: Json | null
          id?: string
          logo?: string | null
          nome_loja: string
          segmento?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id: string
          whatsapp?: string | null
          zona_entrega?: string | null
        }
        Update: {
          banner?: string | null
          created_at?: string | null
          descricao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_latitude?: number | null
          endereco_logradouro?: string | null
          endereco_longitude?: number | null
          endereco_numero?: string | null
          formas_entrega?: Json | null
          id?: string
          logo?: string | null
          nome_loja?: string
          segmento?: string | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
          usuario_id?: string
          whatsapp?: string | null
          zona_entrega?: string | null
        }
        Relationships: []
      }
      vendor_delivery_zones: {
        Row: {
          active: boolean
          created_at: string
          delivery_fee: number | null
          delivery_time: string
          id: string
          updated_at: string
          vendor_id: string
          zone_name: string
          zone_type: string
          zone_value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_fee?: number | null
          delivery_time?: string
          id?: string
          updated_at?: string
          vendor_id: string
          zone_name: string
          zone_type: string
          zone_value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_fee?: number | null
          delivery_time?: string
          id?: string
          updated_at?: string
          vendor_id?: string
          zone_name?: string
          zone_type?: string
          zone_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_delivery_zones_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders_log: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string
        }
        Relationships: []
      }
      vendor_product_restrictions: {
        Row: {
          active: boolean
          created_at: string
          delivery_zone_id: string | null
          id: string
          product_id: string
          restriction_message: string | null
          restriction_type: string
          updated_at: string
          vendor_id: string
          zone_type: string
          zone_value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          product_id: string
          restriction_message?: string | null
          restriction_type?: string
          updated_at?: string
          vendor_id: string
          zone_type: string
          zone_value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          product_id?: string
          restriction_message?: string | null
          restriction_type?: string
          updated_at?: string
          vendor_id?: string
          zone_type?: string
          zone_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_product_restrictions_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "vendor_delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_product_restrictions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_product_restrictions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      zip_cache: {
        Row: {
          bairro: string | null
          cached_at: string | null
          cep: string
          created_at: string | null
          ibge: string | null
          latitude: number | null
          localidade: string | null
          logradouro: string | null
          longitude: number | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          cached_at?: string | null
          cep: string
          created_at?: string | null
          ibge?: string | null
          latitude?: number | null
          localidade?: string | null
          logradouro?: string | null
          longitude?: number | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          cached_at?: string | null
          cep?: string
          created_at?: string | null
          ibge?: string | null
          latitude?: number | null
          localidade?: string | null
          logradouro?: string | null
          longitude?: number | null
          uf?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_user_points: {
        Args: { user_id: string; points_to_add: number }
        Returns: undefined
      }
      apply_coupon: {
        Args:
          | {
              coupon_code: string
              user_id_param: string
              order_id_param: string
              order_value: number
            }
          | {
              coupon_code: string
              user_id_param: string
              order_id_param: string
              order_value: number
              cart_items?: Json
            }
        Returns: {
          success: boolean
          discount_amount: number
          message: string
        }[]
      }
      approve_product: {
        Args: { product_id: string }
        Returns: undefined
      }
      audit_user_points_comprehensive: {
        Args: { target_user_id: string }
        Returns: {
          issue_type: string
          current_balance: number
          calculated_balance: number
          difference: number
          duplicate_count: number
          corrected: boolean
          details: Json
        }[]
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_access_order: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      can_vendor_access_order: {
        Args: { p_order_id: string; p_vendor_id: string }
        Returns: boolean
      }
      check_order_integrity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_product_delivery_restriction: {
        Args: {
          p_vendor_id: string
          p_product_id: string
          p_customer_cep: string
        }
        Returns: {
          has_restriction: boolean
          restriction_type: string
          restriction_message: string
          delivery_available: boolean
        }[]
      }
      check_product_stock: {
        Args: { p_produto_id: string; p_quantidade: number }
        Returns: boolean
      }
      check_sync_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_orders: number
          total_pedidos: number
          missing_pedidos: number
          sync_status: string
          last_check: string
        }[]
      }
      clean_duplicate_transactions_safely: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_count: number
          error_message: string
        }[]
      }
      cleanup_orphan_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_count: number
          orphan_order_ids: string[]
        }[]
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_point_adjustment: {
        Args: {
          p_vendedor_id: string
          p_usuario_id: string
          p_tipo: string
          p_valor: number
          p_motivo: string
        }
        Returns: Json
      }
      execute_custom_sql: {
        Args: { sql_statement: string }
        Returns: Json
      }
      get_current_vendor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_duplicate_transactions: {
        Args: Record<PropertyKey, never>
        Returns: {
          group_id: number
          transaction_count: number
          user_id: string
          tipo: string
          pontos: number
          descricao: string
          transaction_ids: string[]
          data: string
          time_frame: string
        }[]
      }
      get_or_create_reference_id: {
        Args: { p_cliente_id: string; p_created_at: string }
        Returns: string
      }
      get_order_by_id: {
        Args: { order_id: string }
        Returns: Json
      }
      get_point_adjustments_for_vendor: {
        Args: { p_usuario_id: string; p_vendedor_id: string }
        Returns: {
          created_at: string | null
          id: string
          motivo: string
          tipo: string
          usuario_id: string
          valor: number
          vendedor_id: string
        }[]
      }
      get_product_segments: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nome: string
          image_url: string
          status: string
        }[]
      }
      get_user_admin_status: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_vendor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_vendor_pedidos_paginated: {
        Args: {
          p_vendedor_id: string
          p_limit?: number
          p_offset?: number
          p_status_filter?: string
        }
        Returns: {
          id: string
          usuario_id: string
          vendedor_id: string
          status: string
          forma_pagamento: string
          endereco_entrega: Json
          valor_total: number
          cupom_codigo: string
          desconto_aplicado: number
          created_at: string
          cliente_nome: string
          cliente_email: string
          cliente_telefone: string
          total_items: number
        }[]
      }
      get_vendor_stores: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          nome: string
          logo_url: string
        }[]
      }
      increment_services_count: {
        Args: { prof_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action: string
          entity_type: string
          entity_id: string
          details?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: { event_type: string; details?: Json; user_id_param?: string }
        Returns: undefined
      }
      mask_cpf: {
        Args: { cpf_value: string }
        Returns: string
      }
      mask_email: {
        Args: { email_value: string }
        Returns: string
      }
      mask_phone: {
        Args: { phone_value: string }
        Returns: string
      }
      migrate_missing_orders_to_pedidos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_orders_to_pedidos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      migrate_orders_to_vendor_customers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      order_exists_in_pedidos: {
        Args: { order_uuid: string }
        Returns: boolean
      }
      reconcile_user_points: {
        Args: { target_user_id?: string }
        Returns: {
          user_id: string
          old_balance: number
          new_balance: number
          difference: number
        }[]
      }
      resolve_delivery_zones: {
        Args: { user_cep: string }
        Returns: {
          zone_id: string
          vendor_id: string
          zone_name: string
          delivery_fee: number
          delivery_time: string
        }[]
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_orders_migration: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_profiles_for_vendor: {
        Args: { search_query: string }
        Returns: {
          id: string
          nome: string
          email: string
          telefone: string
          cpf: string
        }[]
      }
      secure_admin_promotion: {
        Args: { target_user_id: string; action: string; reason?: string }
        Returns: Json
      }
      secure_insert_zip_cache: {
        Args: {
          p_cep: string
          p_logradouro?: string
          p_bairro?: string
          p_localidade?: string
          p_uf?: string
          p_ibge?: string
          p_latitude?: number
          p_longitude?: number
        }
        Returns: boolean
      }
      update_expired_promotions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_inventory_on_order: {
        Args: { p_produto_id: string; p_quantidade: number }
        Returns: undefined
      }
      update_pedido_status_secure: {
        Args: {
          p_pedido_id: string
          p_vendedor_id: string
          p_new_status: string
        }
        Returns: Json
      }
      update_user_points: {
        Args: { user_id: string; points_to_add: number }
        Returns: undefined
      }
      validate_cart_quantity: {
        Args: { quantity: number }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          coupon_code: string
          user_id_param: string
          order_value: number
          cart_items?: Json
        }
        Returns: {
          valid: boolean
          coupon_id: string
          discount_type: string
          discount_value: number
          discount_amount: number
          message: string
          eligible_products: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
