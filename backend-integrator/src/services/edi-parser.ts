// src/services/ediParser.ts

import { EDIHeader, EDITransaction, EDITrailer, ProcessedEDI, EDISummary } from '../../types/edi';

export class EDIParser {
  
  /**
   * Parse completo do arquivo EDI
   */
  static parseEDIFile(fileContent: string): ProcessedEDI {
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    let header: EDIHeader | null = null;
    const transactions: EDITransaction[] = [];
    let trailer: EDITrailer | null = null;
    
    for (const line of lines) {
      const recordType = line.substring(0, 2);
      
      switch (recordType) {
        case '00':
          header = this.parseHeader(line);
          break;
        case '01':
          transactions.push(this.parseTransaction(line));
          break;
        case '99':
          trailer = this.parseTrailer(line);
          break;
        default:
          console.warn(`Tipo de registro desconhecido: ${recordType}`);
      }
    }
    
    if (!header || !trailer) {
      throw new Error('Arquivo EDI inválido: Header ou Trailer não encontrado');
    }
    
    // Validar integridade
    this.validateEDIFile(header, transactions, trailer);
    
    // Gerar resumo
    const summary = this.generateSummary(transactions, header.processingDate);
    
    return {
      header,
      transactions,
      trailer,
      summary
    };
  }
  
  /**
   * Parse do Header (Registro 00)
   */
  private static parseHeader(line: string): EDIHeader {
    return {
      recordType: '00',
      establishmentCode: line.substring(2, 17).trim(),
      processingDate: line.substring(17, 25),
      sequenceNumber: line.substring(25, 32).trim(),
      extractType: line.substring(32, 34),
      version: line.substring(34, 37),
    };
  }
  
  /**
   * Parse da Transação (Registro 01)
   */
  private static parseTransaction(line: string): EDITransaction {
    const transaction: EDITransaction = {
      recordType: '01',
      establishmentCode: line.substring(2, 17).trim(),
      summaryNumber: line.substring(17, 24).trim(),
      ro: line.substring(24, 31).trim(),
      transactionDate: line.substring(31, 39),
      saleDate: line.substring(39, 47),
      product: line.substring(47, 49),
      modality: line.substring(49, 51),
      resumeNumber: line.substring(51, 58).trim(),
      grossAmount: parseInt(line.substring(58, 71)) / 100, // Converter centavos para reais
      discountRate: parseFloat(line.substring(71, 76)) / 10000, // Taxa percentual
      discountAmount: parseInt(line.substring(76, 89)) / 100,
      netAmount: parseInt(line.substring(89, 102)) / 100,
      bank: line.substring(102, 105),
      agency: line.substring(105, 111).trim(),
      account: line.substring(111, 122).trim(),
      status: line.substring(122, 124),
      installments: parseInt(line.substring(124, 126)) || 1,
      cardBrand: line.substring(126, 129),
      authorizationCode: line.substring(129, 135).trim(),
      nsu: line.substring(135, 141).trim(),
      tid: line.substring(141, 149).trim(),
    };
    
    // Campos opcionais para cancelamentos
    if (line.length > 149) {
      const originalAmountStr = line.substring(149, 162);
      if (originalAmountStr.trim()) {
        transaction.originalAmount = parseInt(originalAmountStr) / 100;
      }
      
      const cancellationDateStr = line.substring(162, 170);
      if (cancellationDateStr.trim() && cancellationDateStr !== '00000000') {
        transaction.cancellationDate = cancellationDateStr;
      }
    }
    
    return transaction;
  }
  
  /**
   * Parse do Trailer (Registro 99)
   */
  private static parseTrailer(line: string): EDITrailer {
    return {
      recordType: '99',
      totalRecords: parseInt(line.substring(2, 9)),
      totalGrossAmount: parseInt(line.substring(9, 22)) / 100,
      totalNetAmount: parseInt(line.substring(22, 35)) / 100,
    };
  }
  
  /**
   * Validação da integridade do arquivo EDI
   */
  private static validateEDIFile(
    header: EDIHeader, 
    transactions: EDITransaction[], 
    trailer: EDITrailer
  ): void {
    // Validar número de registros
    const expectedRecords = transactions.length + 2; // +2 para header e trailer
    if (trailer.totalRecords !== expectedRecords) {
      throw new Error(`Número de registros inválido. Esperado: ${expectedRecords}, Encontrado: ${trailer.totalRecords}`);
    }
    
    // Validar valores totais
    const calculatedGrossAmount = transactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const calculatedNetAmount = transactions.reduce((sum, t) => sum + t.netAmount, 0);
    
    if (Math.abs(trailer.totalGrossAmount - calculatedGrossAmount) > 0.01) {
      throw new Error(`Valor bruto total inválido. Calculado: ${calculatedGrossAmount}, Trailer: ${trailer.totalGrossAmount}`);
    }
    
    if (Math.abs(trailer.totalNetAmount - calculatedNetAmount) > 0.01) {
      throw new Error(`Valor líquido total inválido. Calculado: ${calculatedNetAmount}, Trailer: ${trailer.totalNetAmount}`);
    }
  }
  
  /**
   * Gerar resumo das transações
   */
  private static generateSummary(transactions: EDITransaction[], processingDate: string): EDISummary {
    const creditTransactions = transactions.filter(t => t.product === '01'); // Crédito
    const debitTransactions = transactions.filter(t => t.product === '02'); // Débito
    
    const totalGrossAmount = transactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const totalNetAmount = transactions.reduce((sum, t) => sum + t.netAmount, 0);
    const totalDiscountAmount = transactions.reduce((sum, t) => sum + t.discountAmount, 0);
    
    const creditAmount = creditTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
    const debitAmount = debitTransactions.reduce((sum, t) => sum + t.grossAmount, 0);
    
    return {
      totalTransactions: transactions.length,
      totalGrossAmount,
      totalNetAmount,
      totalDiscountAmount,
      creditTransactions: creditTransactions.length,
      debitTransactions: debitTransactions.length,
      creditAmount,
      debitAmount,
      averageTicket: transactions.length > 0 ? totalGrossAmount / transactions.length : 0,
      processingDate,
    };
  }
  
  /**
   * Formatar data do EDI (AAAAMMDD) para formato brasileiro
   */
  static formatEDIDate(ediDate: string): string {
    if (ediDate.length !== 8) return ediDate;
    
    const year = ediDate.substring(0, 4);
    const month = ediDate.substring(4, 6);
    const day = ediDate.substring(6, 8);
    
    return `${day}/${month}/${year}`;
  }
  
  /**
   * Obter descrição do produto
   */
  static getProductDescription(productCode: string): string {
    const products: { [key: string]: string } = {
      '01': 'Crédito à Vista',
      '02': 'Débito à Vista',
      '03': 'Crédito Parcelado Loja',
      '04': 'Crédito Parcelado Emissor',
      '05': 'PIX',
      '06': 'Voucher',
    };
    
    return products[productCode] || `Produto ${productCode}`;
  }
  
  /**
   * Obter descrição da bandeira
   */
  static getCardBrandDescription(brandCode: string): string {
    const brands: { [key: string]: string } = {
      'VIS': 'Visa',
      'MAS': 'Mastercard',
      'ELO': 'Elo',
      'AME': 'American Express',
      'DIN': 'Diners',
      'HIP': 'Hipercard',
      'JCB': 'JCB',
    };
    
    return brands[brandCode] || brandCode;
  }
}