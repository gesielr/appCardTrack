// src/types/edi.ts

export interface EDIFile {
    id: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
    processedDate?: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    recordCount: number;
    establishmentCode: string;
    processingDate: string;
    errors?: string[];
  }
  
  export interface EDIHeader {
    recordType: '00'; // Tipo de registro - Header
    establishmentCode: string; // Código do estabelecimento (15 posições)
    processingDate: string; // Data de processamento AAAAMMDD
    sequenceNumber: string; // Número sequencial do arquivo
    extractType: string; // Tipo de extrato
    version: string; // Versão do layout
  }
  
  export interface EDITransaction {
    recordType: '01'; // Tipo de registro - Transação
    establishmentCode: string;
    summaryNumber: string;
    ro: string; // Resumo de Operações
    transactionDate: string; // AAAAMMDD
    saleDate: string; // AAAAMMDD
    product: string; // Produto (Crédito/Débito)
    modality: string; // Modalidade
    resumeNumber: string;
    grossAmount: number; // Valor bruto em centavos
    discountRate: number; // Taxa de desconto
    discountAmount: number; // Valor do desconto
    netAmount: number; // Valor líquido
    bank: string; // Banco
    agency: string; // Agência
    account: string; // Conta
    status: string; // Status da transação
    installments: number; // Número de parcelas
    cardBrand: string; // Bandeira do cartão
    authorizationCode: string; // Código de autorização
    nsu: string; // NSU
    tid: string; // TID
    originalAmount?: number; // Valor original (para cancelamentos)
    cancellationDate?: string; // Data do cancelamento
  }
  
  export interface EDITrailer {
    recordType: '99'; // Tipo de registro - Trailer
    totalRecords: number; // Total de registros no arquivo
    totalGrossAmount: number; // Valor bruto total
    totalNetAmount: number; // Valor líquido total
  }
  
  export interface ProcessedEDI {
    header: EDIHeader;
    transactions: EDITransaction[];
    trailer: EDITrailer;
    summary: EDISummary;
  }
  
  export interface EDISummary {
    totalTransactions: number;
    totalGrossAmount: number;
    totalNetAmount: number;
    totalDiscountAmount: number;
    creditTransactions: number;
    debitTransactions: number;
    creditAmount: number;
    debitAmount: number;
    averageTicket: number;
    processingDate: string;
  }