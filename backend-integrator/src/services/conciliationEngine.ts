// src/services/conciliationEngine.ts

import { 
    BankTransaction, 
    ConciliationMatch, 
    ConciliationRule, 
    ConciliationDifference, 
    ConciliationReport, 
    ConciliationSummary
  } from '../../types/conciliation';
  import { EDITransaction } from '../../types/edi';
  
  export class ConciliationEngine {
    
    /**
     * Executa a conciliação automática
     */
    static async performAutomaticConciliation(
      bankTransactions: BankTransaction[],
      ediTransactions: EDITransaction[],
      rules: ConciliationRule[]
    ): Promise<ConciliationMatch[]> {
      const matches: ConciliationMatch[] = [];
      const usedEdiTransactions = new Set<string>();
      
      // Ordenar regras por prioridade
      const sortedRules = rules
        .filter(rule => rule.isActive)
        .sort((a, b) => b.priority - a.priority);
      
      for (const bankTransaction of bankTransactions) {
        if (bankTransaction.status === 'reconciled') continue;
        
        // ATENÇÃO: 'summaryNumber' está sendo usado como identificador único da transação EDI
        const availableEdiTransactions = ediTransactions.filter(
          edi => !usedEdiTransactions.has(edi.summaryNumber)
        );
        
        for (const rule of sortedRules) {
          const match = await this.findBestMatch(
            bankTransaction,
            availableEdiTransactions,
            rule
          );
          
          if (match && match.matchScore >= 70) { // Score mínimo para match automático
            matches.push(match);
            usedEdiTransactions.add(match.ediTransactionId);
            break; // Encontrou match, próxima transação bancária
          }
        }
      }
      
      return matches;
    }
    
    /**
     * Encontra o melhor match para uma transação bancária
     */
    private static async findBestMatch(
      bankTransaction: BankTransaction,
      ediTransactions: EDITransaction[],
      rule: ConciliationRule
    ): Promise<ConciliationMatch | null> {
      let bestMatch: ConciliationMatch | null = null;
      let bestScore = 0;
      
      for (const ediTransaction of ediTransactions) {
        const score = this.calculateMatchScore(bankTransaction, ediTransaction, rule);
        
        if (score > bestScore && score >= 50) { // Score mínimo para considerar
          const differences = this.calculateDifferences(bankTransaction, ediTransaction);
          
          bestMatch = {
            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bankTransactionId: bankTransaction.id,
            // ATENÇÃO: 'summaryNumber' está sendo usado como identificador único da transação EDI
            ediTransactionId: ediTransaction.summaryNumber,
            matchScore: score,
            matchType: score >= 90 ? 'automatic' : 'suggested',
            status: rule.autoApprove && score >= 90 ? 'approved' : 'pending',
            differences,
            createdAt: new Date().toISOString(),
            userId: bankTransaction.userId,
          };
          
          bestScore = score;
        }
      }
      
      return bestMatch;
    }
    
    /**
     * Calcula o score de compatibilidade entre transações
     */
    private static calculateMatchScore(
      bankTransaction: BankTransaction,
      ediTransaction: EDITransaction,
      rule: ConciliationRule
    ): number {
      let totalScore = 0;
      let totalWeight = 0;
      
      for (const condition of rule.conditions) {
        const conditionScore = this.evaluateCondition(
          bankTransaction,
          ediTransaction,
          condition,
          rule.tolerance
        );
        
        totalScore += conditionScore * condition.weight;
        totalWeight += condition.weight;
      }
      
      return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }
    
    /**
     * Avalia uma condição específica
     */
    private static evaluateCondition(
      bankTransaction: BankTransaction,
      ediTransaction: EDITransaction,
      condition: any,
      tolerance: number
    ): number {
      switch (condition.field) {
        case 'amount':
          return this.compareAmounts(
            bankTransaction.amount,
            ediTransaction.netAmount,
            tolerance,
            condition.operator
          );
        
        case 'date':
          return this.compareDates(
            bankTransaction.date,
            ediTransaction.transactionDate,
            condition.operator
          );
        
        case 'description':
          return this.compareDescriptions(
            bankTransaction.description,
            ediTransaction.cardBrand,
            condition.operator
          );
        
        default:
          return 0;
      }
    }
    
    /**
     * Compara valores monetários
     */
    private static compareAmounts(
      bankAmount: number,
      ediAmount: number,
      tolerance: number,
      operator: string
    ): number {
      const difference = Math.abs(bankAmount - ediAmount);
      
      switch (operator) {
        case 'equals':
          return difference <= (tolerance / 100) ? 100 : 0;
        
        case 'range':
          const percentageDiff = (difference / Math.max(bankAmount, ediAmount)) * 100;
          if (percentageDiff <= 1) return 100;
          if (percentageDiff <= 3) return 80;
          if (percentageDiff <= 5) return 60;
          if (percentageDiff <= 10) return 40;
          return 0;
        
        default:
          return 0;
      }
    }
    
    /**
     * Compara datas
     */
    private static compareDates(bankDate: string, ediDate: string, operator: string): number {
      const bankDateObj = new Date(bankDate);
      const ediDateObj = new Date(this.formatEDIDate(ediDate));
      const diffDays = Math.abs(
        (bankDateObj.getTime() - ediDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      switch (operator) {
        case 'equals':
          return diffDays === 0 ? 100 : 0;
        
        case 'range':
          if (diffDays === 0) return 100;
          if (diffDays <= 1) return 90;
          if (diffDays <= 2) return 70;
          if (diffDays <= 5) return 50;
          if (diffDays <= 10) return 30;
          return 0;
        
        default:
          return 0;
      }
    }
    
    /**
     * Compara descrições usando algoritmo de similaridade
     */
    private static compareDescriptions(
      bankDescription: string,
      ediDescription: string,
      operator: string
    ): number {
      const bank = bankDescription.toLowerCase().trim();
      const edi = ediDescription.toLowerCase().trim();
      
      switch (operator) {
        case 'contains':
          if (bank.includes('cielo') || bank.includes('card') || bank.includes('cartao')) {
            return 80;
          }
          return bank.includes(edi) || edi.includes(bank) ? 60 : 0;
        
        case 'fuzzy':
          return this.calculateStringSimilarity(bank, edi);
        
        default:
          return bank === edi ? 100 : 0;
      }
    }
    
    /**
     * Calcula similaridade entre strings usando Levenshtein
     */
    private static calculateStringSimilarity(str1: string, str2: string): number {
      const matrix = [];
      const len1 = str1.length;
      const len2 = str2.length;
      
      for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      const maxLen = Math.max(len1, len2);
      const similarity = ((maxLen - matrix[len2][len1]) / maxLen) * 100;
      return Math.round(similarity);
    }
    
    /**
     * Calcula as diferenças entre transações
     */
    private static calculateDifferences(
      bankTransaction: BankTransaction,
      ediTransaction: EDITransaction
    ): ConciliationDifference[] {
      const differences: ConciliationDifference[] = [];
      
      // Diferença de valor
      const amountDiff = bankTransaction.amount - ediTransaction.netAmount;
      if (Math.abs(amountDiff) > 0.01) {
        differences.push({
          field: 'amount',
          bankValue: bankTransaction.amount,
          ediValue: ediTransaction.netAmount,
          difference: amountDiff,
          percentage: (amountDiff / ediTransaction.netAmount) * 100,
        });
      }
      
      // Diferença de data
      const bankDate = new Date(bankTransaction.date);
      const ediDate = new Date(this.formatEDIDate(ediTransaction.transactionDate));
      const dateDiff = (bankDate.getTime() - ediDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (Math.abs(dateDiff) > 0) {
        differences.push({
          field: 'date',
          bankValue: bankTransaction.date,
          ediValue: ediTransaction.transactionDate,
          difference: dateDiff,
          percentage: 0,
        });
      }
      
      return differences;
    }
    
    /**
     * Formata data EDI para formato padrão
     */
    private static formatEDIDate(ediDate: string): string {
      if (ediDate.length !== 8) return ediDate;
      
      const year = ediDate.substring(0, 4);
      const month = ediDate.substring(4, 6);
      const day = ediDate.substring(6, 8);
      
      return `${year}-${month}-${day}`;
    }
    
    /**
     * Gera resumo da conciliação
     */
    static generateSummary(
      bankTransactions: BankTransaction[],
      ediTransactions: EDITransaction[],
      matches: ConciliationMatch[]
    ): ConciliationSummary {
      const approvedMatches = matches.filter(m => m.status === 'approved');
      const matchedBankIds = new Set(approvedMatches.map(m => m.bankTransactionId));
      const matchedEdiIds = new Set(approvedMatches.map(m => m.ediTransactionId));
      
      const totalBankAmount = bankTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalEdiAmount = ediTransactions.reduce((sum, t) => sum + t.netAmount, 0);
      
      const matchedBankTransactions = bankTransactions.filter(t => matchedBankIds.has(t.id));
      const matchedAmount = matchedBankTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        totalBankTransactions: bankTransactions.length,
        totalEdiTransactions: ediTransactions.length,
        matchedTransactions: approvedMatches.length,
        unmatchedBankTransactions: bankTransactions.length - matchedBankIds.size,
        unmatchedEdiTransactions: ediTransactions.length - matchedEdiIds.size,
        totalBankAmount,
        totalEdiAmount,
        matchedAmount,
        differenceAmount: totalBankAmount - totalEdiAmount,
        matchPercentage: bankTransactions.length > 0 
          ? (approvedMatches.length / bankTransactions.length) * 100 
          : 0,
      };
    }
  }