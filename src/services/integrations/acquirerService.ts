import { Transaction } from '../../types';
import axios from 'axios';

interface AcquirerConfig {
  merchantId: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
}

interface TransactionResponse {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  installments: number;
  tax: number;
  created_at: string;
  updatedAt: string;
}

export class AcquirerService {
  private baseUrl: string;
  private config: AcquirerConfig;

  constructor(config: AcquirerConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://api-sandbox.cielo.com.br' 
      : 'https://api.cielo.com.br';
  }

  private async getHeaders() {
    const auth = Buffer.from(`${this.config.merchantId}:${this.config.apiKey}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };
  }

  async fetchTransactions(dateRange: { startDate: string; endDate: string }): Promise<Transaction[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transactions`, {
        headers,
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });

      return response.data.map((transaction: TransactionResponse) => ({
        id: transaction.id,
        amount: transaction.amount,
        date: transaction.created_at,
        description: `Transação ${transaction.paymentMethod}`,
        type: transaction.paymentMethod === 'credit' ? 'credit' : 'debit',
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        installments: transaction.installments,
        tax: transaction.tax,
        source: 'acquirer',
        reconciled: false,
        created_at: transaction.created_at,
        updatedAt: transaction.updatedAt,
      }));
    } catch (error) {
      console.error('Erro ao buscar transações da adquirente:', error);
      throw error;
    }
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(`${this.baseUrl}/transactions`, transaction, {
        headers,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  async cancelTransaction(transactionId: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.delete(`${this.baseUrl}/transactions/${transactionId}`, {
        headers,
      });
      return true;
    } catch (error) {
      console.error('Erro ao cancelar transação:', error);
      throw error;
    }
  }

  async captureTransaction(transactionId: string): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      await axios.post(`${this.baseUrl}/transactions/${transactionId}/capture`, {}, {
        headers,
      });
      return true;
    } catch (error) {
      console.error('Erro ao capturar transação:', error);
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<Transaction> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}`, {
        headers,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar status da transação:', error);
      throw error;
    }
  }
}
