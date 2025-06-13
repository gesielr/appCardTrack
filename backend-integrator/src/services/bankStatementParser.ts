// src/services/bankStatementParser.ts

import * as fs from 'fs';
import { BankTransaction } from '../../types/conciliation';

export class BankStatementParser {
  
  /**
   * Parse de arquivo de extrato bancário
   */
  static async parseFile(file: any): Promise<BankTransaction[]> {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    switch (fileExtension) {
      case 'csv':
        return this.parseCSV(file);
      case 'txt':
        return this.parseTXT(file);
      case 'ofx':
        return this.parseOFX(file);
      default:
        throw new Error(`Formato de arquivo não suportado: ${fileExtension}`);
    }
  }
  
  /**
   * Parse de arquivo CSV
   */
  private static async parseCSV(file: { fileCopyUri: string }): Promise<BankTransaction[]> {
    try {
      const content = await fs.promises.readFile(file.fileCopyUri, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Detectar separador (vírgula ou ponto e vírgula)
      const separator = content.includes(';') ? ';' : ',';
      
      // Primeira linha geralmente é o cabeçalho
      const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
      const transactions: BankTransaction[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i], separator);
        
        if (values.length >= 3) { // Mínimo: data, descrição, valor
          const transaction = this.mapCSVToTransaction(headers, values, i);
          if (transaction) {
            transactions.push(transaction);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo CSV: ${error}`);
    }
  }
  
  /**
   * Parse de linha CSV considerando aspas
   */
  private static parseCSVLine(line: string, separator: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }
  
  /**
   * Mapear dados CSV para transação
   */
  private static mapCSVToTransaction(
    headers: string[], 
    values: string[], 
    index: number
  ): BankTransaction | null {
    try {
      // Detectar colunas automaticamente
      const dateIndex = this.findColumnIndex(headers, ['data', 'date', 'dt']);
      const descriptionIndex = this.findColumnIndex(headers, ['descricao', 'description', 'historico', 'desc']);
      const amountIndex = this.findColumnIndex(headers, ['valor', 'amount', 'vlr']);
      const balanceIndex = this.findColumnIndex(headers, ['saldo', 'balance']);
      
      if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
        console.warn(`Linha ${index + 1}: Colunas obrigatórias não encontradas`);
        return null;
      }
      
      const dateStr = values[dateIndex]?.replace(/"/g, '');
      const description = values[descriptionIndex]?.replace(/"/g, '');
      const amountStr = values[amountIndex]?.replace(/"/g, '');
      const balanceStr = balanceIndex !== -1 ? values[balanceIndex]?.replace(/"/g, '') : '0';
      
      // Parse da data
      const date = this.parseDate(dateStr);
      if (!date) {
        console.warn(`Linha ${index + 1}: Data inválida: ${dateStr}`);
        return null;
      }
      
      // Parse do valor
      const amount = this.parseAmount(amountStr);
      if (isNaN(amount)) {
        console.warn(`Linha ${index + 1}: Valor inválido: ${amountStr}`);
        return null;
      }
      
      const balance = this.parseAmount(balanceStr) || 0;
      
      return {
        id: `bank_${Date.now()}_${index}`,
        date: date.toISOString().split('T')[0],
        description: description.trim(),
        amount: Math.abs(amount), // Sempre positivo, tipo determina débito/crédito
        balance,
        type: amount >= 0 ? 'credit' : 'debit',
        status: 'pending',
        importedAt: new Date().toISOString(),
        userId: '', // Será preenchido na tela
      };
    } catch (error) {
      console.warn(`Erro ao processar linha ${index + 1}:`, error);
      return null;
    }
  }
  
  /**
   * Parse de arquivo TXT (formato posicional)
   */
  private static async parseTXT(file: { fileCopyUri: string }): Promise<BankTransaction[]> {
    try {
      const content = await fs.promises.readFile(file.fileCopyUri, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      const transactions: BankTransaction[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Formato comum: DDMMAAAA DESCRIÇÃO VALOR
        if (line.length >= 20) {
          const dateStr = line.substring(0, 8); // DDMMAAAA
          const description = line.substring(8, line.length - 15).trim();
          const amountStr = line.substring(line.length - 15).trim();
          
          const date = this.parseDateDDMMYYYY(dateStr);
          const amount = this.parseAmount(amountStr);
          
          if (date && !isNaN(amount)) {
            transactions.push({
              id: `bank_txt_${Date.now()}_${i}`,
              date: date.toISOString().split('T')[0],
              description,
              amount: Math.abs(amount),
              balance: 0,
              type: amount >= 0 ? 'credit' : 'debit',
              status: 'pending',
              importedAt: new Date().toISOString(),
              userId: '',
            });
          }
        }
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo TXT: ${error}`);
    }
  }
  
  /**
   * Parse de arquivo OFX
   */
  private static async parseOFX(file: { fileCopyUri: string }): Promise<BankTransaction[]> {
    try {
      const content = await fs.promises.readFile(file.fileCopyUri, 'utf8');
      const transactions: BankTransaction[] = [];
      
      // Regex para extrair transações OFX
      const transactionRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
      const matches = content.match(transactionRegex);
      
      if (matches) {
        matches.forEach((match, index) => {
          const transaction = this.parseOFXTransaction(match, index);
          if (transaction) {
            transactions.push(transaction);
          }
        });
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo OFX: ${error}`);
    }
  }
  
  /**
   * Parse de uma transação OFX
   */
  private static parseOFXTransaction(transactionXML: string, index: number): BankTransaction | null {
    try {
      const getValue = (tag: string): string => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i');
        const match = transactionXML.match(regex);
        return match ? match[1].trim() : '';
      };
      
      const dateStr = getValue('DTPOSTED');
      const amount = parseFloat(getValue('TRNAMT'));
      const description = getValue('MEMO') || getValue('NAME');
      const fitid = getValue('FITID');
      
      if (!dateStr || isNaN(amount) || !description) {
        return null;
      }
      
      // Data OFX: YYYYMMDD
      const date = new Date(
        parseInt(dateStr.substring(0, 4)),
        parseInt(dateStr.substring(4, 6)) - 1,
        parseInt(dateStr.substring(6, 8))
      );
      
      return {
        id: fitid || `bank_ofx_${Date.now()}_${index}`,
        date: date.toISOString().split('T')[0],
        description,
        amount: Math.abs(amount),
        balance: 0,
        type: amount >= 0 ? 'credit' : 'debit',
        reference: fitid,
        status: 'pending',
        importedAt: new Date().toISOString(),
        userId: '',
      };
    } catch (error) {
      console.warn(`Erro ao processar transação OFX ${index}:`, error);
      return null;
    }
  }
  
  /**
   * Encontrar índice da coluna por nomes possíveis
   */
  private static findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
      const index = headers.findIndex(header => 
        header.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  }
  
  /**
   * Parse de data em vários formatos
   */
  private static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Remover caracteres especiais
    const cleanDate = dateStr.replace(/[^\d]/g, '');
    
    // Tentar vários formatos
    const formats = [
      // DDMMAAAA
      () => {
        if (cleanDate.length === 8) {
          const day = parseInt(cleanDate.substring(0, 2));
          const month = parseInt(cleanDate.substring(2, 4));
          const year = parseInt(cleanDate.substring(4, 8));
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // AAAAMMDD
      () => {
        if (cleanDate.length === 8) {
          const year = parseInt(cleanDate.substring(0, 4));
          const month = parseInt(cleanDate.substring(4, 6));
          const day = parseInt(cleanDate.substring(6, 8));
          return new Date(year, month - 1, day);
        }
        return null;
      },
      // DD/MM/AAAA ou DD-MM-AAAA
      () => {
        const parts = dateStr.split(/[\/\-]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          return new Date(year, month - 1, day);
        }
        return null;
      }
    ];
    
    for (const format of formats) {
      try {
        const date = format();
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * Parse de data no formato DDMMAAAA
   */
  private static parseDateDDMMYYYY(dateStr: string): Date | null {
    if (dateStr.length !== 8) return null;
    
    try {
      const day = parseInt(dateStr.substring(0, 2));
      const month = parseInt(dateStr.substring(2, 4));
      const year = parseInt(dateStr.substring(4, 8));
      
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Parse de valor monetário
   */
  private static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remover espaços e caracteres especiais, manter apenas números, vírgula e ponto
    let cleanAmount = amountStr.replace(/[^\d,.-]/g, '');
    
    // Detectar se vírgula é separador decimal ou milhares
    const commaIndex = cleanAmount.lastIndexOf(',');
    const dotIndex = cleanAmount.lastIndexOf('.');
    
    if (commaIndex > dotIndex) {
      // Vírgula é o separador decimal
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    } else if (dotIndex > commaIndex) {
      // Ponto é o separador decimal
      cleanAmount = cleanAmount.replace(/,/g, '');
    }
    
    // Tratar sinal negativo
    const isNegative = amountStr.includes('-') || amountStr.includes('D');
    const amount = parseFloat(cleanAmount);
    
    return isNegative ? -Math.abs(amount) : amount;
  }
}