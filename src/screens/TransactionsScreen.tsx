// src/screens/TransactionsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';

type Transaction = {
  id: string;
  transaction_date: string;
  amount: number;
  net_amount: number;
  card_brand: string;
  transaction_type: string;
  nsu: string;
  auth_code: string;
  installments: number;
  operator_source: string;
};

type ConciliationFile = {
  id: string;
  file_name: string;
  operator: string;
  status: string;
  created_at: string;
  transaction_count: number;
};

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fileDetails, setFileDetails] = useState<ConciliationFile | null>(null);
  const [loading, setLoading] = useState(true);
  const route = useRoute();
  const navigation = useNavigation();
  
  const { conciliationFileId } = route.params || {};

  useEffect(() => {
    if (conciliationFileId) {
      fetchFileDetails();
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [conciliationFileId]);

  async function fetchFileDetails() {
    try {
      if (!conciliationFileId) return;
      
      const { data, error } = await supabase
        .from('conciliation_files')
        .select('id, file_name, operator, status, created_at, transaction_count')
        .eq('id', conciliationFileId)
        .single();
      
      if (error) throw error;
      
      setFileDetails(data);
      
      // Atualizar título da tela
      navigation.setOptions({
        title: `Transações - ${data.file_name}`
      });
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  }

  async function fetchTransactions() {
    try {
      setLoading(true);
      
      if (!conciliationFileId) {
        // Buscar todas as transações se não houver filtro de arquivo
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        setTransactions(data || []);
      } else {
        // Buscar transações do arquivo específico
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('conciliation_file_id', conciliationFileId)
          .order('transaction_date', { ascending: false });
        
        if (error) throw error;
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }

  return (
    <View style={styles.container}>
      {fileDetails && (
        <View style={styles.fileInfoCard}>
          <Text style={styles.fileInfoTitle}>{fileDetails.file_name}</Text>
          <View style={styles.fileInfoDetails}>
            <Text>Operadora: {fileDetails.operator}</Text>
            <Text>Status: {fileDetails.status}</Text>
            <Text>Data: {formatDate(fileDetails.created_at)}</Text>
            <Text>Total de transações: {fileDetails.transaction_count}</Text>
          </View>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Carregando transações...</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Bruto</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Líquido</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(transactions.reduce((sum, t) => sum + t.net_amount, 0))}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Transações</Text>
              <Text style={styles.summaryValue}>{transactions.length}</Text>
            </View>
          </View>
        
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionDate}>
                    {formatDate(item.transaction_date)}
                  </Text>
                  <Text style={styles.cardBrand}>
                    {item.card_brand}
                  </Text>
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>
                    {item.transaction_type}
                    {item.installments > 1 ? ` (${item.installments}x)` : ''}
                  </Text>
                  <Text style={styles.transactionId}>
                    NSU: {item.nsu} {item.auth_code ? `| Auth: ${item.auth_code}` : ''}
                  </Text>
                </View>
                
                <View style={styles.transactionAmounts}>
                  <Text style={styles.amountLabel}>Bruto:</Text>
                  <Text style={styles.amountValue}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <Text style={styles.amountLabel}>Líquido:</Text>
                  <Text style={styles.amountValue}>
                    {formatCurrency(item.net_amount)}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhuma transação encontrada
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  fileInfoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  fileInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fileInfoDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionDate: {
    fontWeight: 'bold',
  },
  cardBrand: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
  },
  transactionDetails: {
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 14,
  },
  transactionId: {
    fontSize: 12,
    color: '#757575',
  },
  transactionAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 4,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});