import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { supabase } from '../lib/supabase';
import { Transaction, Reconciliation } from '../types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList, RootStackParamList } from '../types';

// HomeScreen é uma tela dentro do TabNavigator, especificamente a aba 'Home'
// Sua prop navigation pode navegar para outras abas (TabParamList) ou para telas do Stack pai (RootStackParamList)
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
        // Buscar transações
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (transactionsError) throw transactionsError;
        
        // Buscar conciliações
        const { data: reconciliationsData, error: reconciliationsError } = await supabase
          .from('reconciliations')
          .select('*')
          .order('created_at', { ascending: false });

        if (reconciliationsError) throw reconciliationsError;

        // Calcular métricas
        const sales = transactionsData.reduce((sum, t) => sum + t.amount, 0);
        const reconciled = reconciliationsData.filter(r => r.status === 'matched')
          .reduce((sum, r) => sum + r.amount, 0);
        const pending = reconciliationsData.filter(r => r.status === 'pending').length;

        setTransactions(transactionsData);
        setReconciliations(reconciliationsData);
        setTotalSales(sales);
        setTotalReconciled(reconciled);
        setPendingReconciliations(pending);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <View style={styles.container}>
      <Dashboard
        navigation={navigation} // Pass navigation prop
        transactions={transactions}
        reconciliations={reconciliations}
        totalSales={totalSales}
        totalReconciled={totalReconciled}
        pendingReconciliations={pendingReconciliations}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default HomeScreen;
