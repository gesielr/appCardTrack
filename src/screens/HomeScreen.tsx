import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { supabase } from '../lib/supabase';
import { Transaction, Reconciliation } from '../types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';

type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalReconciled, setTotalReconciled] = useState(0);
  const [pendingReconciliations, setPendingReconciliations] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const transactionsData = await import('../lib/ediDashboard').then(m => m.fetchDashboardEdiData());
        const reconciliationsData: Reconciliation[] = [];
        const sales = transactionsData.reduce((sum, t) => sum + t.amount, 0);
        setTransactions(transactionsData);
        setReconciliations(reconciliationsData);
        setTotalSales(sales);
        setTotalReconciled(0);
        setPendingReconciliations(0);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Dashboard
        navigation={navigation}
        transactions={transactions}
        reconciliations={reconciliations}
        totalSales={totalSales}
        totalReconciled={totalReconciled}
        pendingReconciliations={pendingReconciliations}
      />
      <Text style={styles.menuTitle}>Ações Rápidas</Text>
      <View style={styles.cardsContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProfileScreen')}>
          <Icon name="account" size={32} color="#007AFF" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OperatorSettingsScreen')}>
          <Icon name="cog" size={32} color="#007AFF" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Configurações do Operador</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ConciliationScreen')}>
          <Icon name="file-document" size={32} color="#007AFF" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Conciliação Avançada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Importar')}>
          <Icon name="upload" size={32} color="#007AFF" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Importar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PaymentLinks')}>
          <Icon name="link" size={32} color="#007AFF" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Links de Pagamento</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: '#007AFF',
    alignSelf: 'flex-start',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    minWidth: 140,
    minHeight: 90,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 4,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

export default HomeScreen;