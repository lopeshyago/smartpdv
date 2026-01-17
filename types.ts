
export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  priceAtTime: number;
}

export interface Table {
  id: number;
  status: 'Livre' | 'Ocupada';
  orders: OrderItem[];
}

export type PaymentMethod = 'Pix' | 'Cartão' | 'Dinheiro';

export interface Sale {
  id: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  userId?: string;
  timestamp: number;
}

export type AppTab = 'mesas' | 'venda-direta' | 'produtos' | 'equipe' | 'dashboard';
