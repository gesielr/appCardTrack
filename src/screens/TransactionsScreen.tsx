import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Searchbar, ActivityIndicator } from 'react-native-paper';
import { Transaction } from '../types';
import { supabase } from '../lib/supabase';

interface TransactionItemProps {
  transaction: Transaction;
  onRefresh: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onRefresh }) => {
  return (
    <Card
      style={styles.card}
      onPress={() => {
        // Implementar detalhes da transação
      }}
    >
      <Card.Content>
        <Title>{transaction.description}</Title>
        <Paragraph style={styles.amount}>
          {transaction.type === 'debit' ? '-' : '+'} R$ {transaction.amount.toFixed(2)}
        </Paragraph>
        <Paragraph style={styles.date}>
          {new Date(transaction.date).toLocaleDateString()}
        </Paragraph>
        <Paragraph style={styles.paymentMethod}>
          {transaction.paymentMethod}
        </Paragraph>
      </Card.Content>
    </Card>
  );
};

const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar transações..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onRefresh={fetchTransactions} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTransactions} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Paragraph style={styles.emptyText}>Nenhuma transação encontrada</Paragraph>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  paymentMethod: {
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
});

export default TransactionsScreen;
