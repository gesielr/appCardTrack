// src/types/conciliation.ts

export interface BankTransaction {
    id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    balance: number;
    type: 'credit' | 'debit';
    reference?: string;
    documentNumber?: string;
    bankCode?: string;
    agencyCode?: string;
    accountNumber?: string;
    operationType?: string;
    status: 'pending' | 'reconciled' | 'ignored';
    reconciledWith?: string; // ID da transação EDI
    importedAt: string;
    userId: string;
  }
  
  export interface ConciliationRule {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    priority: number;
    conditions: ConciliationCondition[];
    tolerance: number; // Tolerância em centavos
    autoApprove: boolean;
    userId: string;
  }
  
  export interface ConciliationCondition {
    field: 'amount' | 'date' | 'description';
    operator: 'equals' | 'contains' | 'range' | 'fuzzy';
    value: string | number;
    weight: number; // Peso da condição (0-100)
  }
  
  export interface ConciliationMatch {
    id: string;
    bankTransactionId: string;
    ediTransactionId: string;
    matchScore: number; // 0-100
    matchType: 'automatic' | 'manual' | 'suggested';
    status: 'pending' | 'approved' | 'rejected';
    differences: ConciliationDifference[];
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    userId: string;
  }
  
  export interface ConciliationDifference {
    field: string;
    bankValue: any;
    ediValue: any;
    difference: number;
    percentage: number;
  }
  
  export interface ConciliationSummary {
    totalBankTransactions: number;
    totalEdiTransactions: number;
    matchedTransactions: number;
    unmatchedBankTransactions: number;
    unmatchedEdiTransactions: number;
    totalBankAmount: number;
    totalEdiAmount: number;
    matchedAmount: number;
    differenceAmount: number;
    matchPercentage: number;
    lastConciliationDate?: string;
  }
  
  export interface ConciliationReport {
    id: string;
    title: string;
    period: {
      startDate: string;
      endDate: string;
    };
    summary: ConciliationSummary;
    matches: ConciliationMatch[];
    unmatchedBank: BankTransaction[];
    unmatchedEdi: any[];
    generatedAt: string;
    generatedBy: string;
  }