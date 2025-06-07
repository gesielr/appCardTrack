// src/types.ts

// Define os parâmetros para cada rota no StackNavigator principal
export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined; // Rota que leva ao TabNavigator
  Importar: undefined; // Tela de Importação
  Notificacoes: undefined; // Tela de Notificações
  Relatorios: undefined; // Tela de Relatórios
  // Adicione outras rotas do Stack aqui se houver
};

// Define os parâmetros para cada rota no TabNavigator
export type TabParamList = {
  Home: undefined; // Aba Home, mostra o Dashboard
  Pagamentos: undefined; // Aba de Pagamentos
  Transacoes: undefined; // Aba de Transações
  Conciliacao: undefined; // Nova aba de Conciliação Bancária
  // Se uma aba precisar de parâmetros, defina-os aqui
};

// Interface para um item de Transação (exemplo, ajuste conforme sua necessidade)
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit' | 'pix';
  status: 'pending' | 'reconciled' | 'cancelled';
  paymentMethod: string;
  tax?: number;
  source?: string;
  reconciled?: boolean;
  created_at: string;
  updatedAt?: string;
  // Adicione outros campos se necessário
}

// Interface para um item de Conciliação (exemplo, ajuste conforme sua necessidade)
export interface Reconciliation {
  id: string;
  date: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'matched';
  transactionId?: string; // ID da transação relacionada
  bankStatementId?: string; // ID do extrato bancário
  notes?: string;
  created_at: string;
  difference?: number; // Diferença encontrada na conciliação
  reason?: string; // Razão para a diferença ou status
  // Adicione outros campos se necessário
}

// Interface para Usuário
export interface User {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  // Adicione outros campos conforme necessário
}

// Interface para Produto (exemplo)
export interface Product {
  id: string;
  name: string;
  price: number;
  // Adicione outros campos conforme necessário
}

// Interface para Link de Pagamento (exemplo)
export interface PaymentLink {
  id: string;
  url: string;
  amount: number;
  description?: string;
  productId?: string; // ID do produto relacionado
  status: 'active' | 'inactive' | 'paid';
  created_at: string;
  // Adicione outros campos conforme necessário
}

// Você pode adicionar outras interfaces e tipos globais aqui
