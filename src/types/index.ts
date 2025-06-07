export interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  type: 'credit' | 'debit' | 'pix';
  status: 'pending' | 'completed' | 'canceled' | 'chargeback';
  paymentMethod: string;
  installments?: number;
  tax: number;
  source: string;
  reconciled: boolean;
  customerPhone?: string;
  created_at: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

export interface PaymentLink {
  id: string;
  url: string;
  products: Product[];
  expiresAt: string;
  status: 'active' | 'expired' | 'paid';
  created_at: string;
}

export interface Reconciliation {
  id: string;
  transactionId: string;
  sourceTransactionId: string;
  status: 'matched' | 'unmatched' | 'pending';
  difference: number;
  reason?: string;
  resolvedAt?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  preferences: {
    notificationChannels: string[];
    minNotificationValue: number;
  };
  avatarUrl?: string; // Adicionando campo opcional da outra definição
}
