import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { supabase } from '../lib/supabase';
import { Transaction, Reconciliation } from '../types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';

type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 colunas com margem

// ============================================================================
// INTERFACES
// ============================================================================

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  screen: string;
  color: string;
  description?: string;
}

// ============================================================================
// QUICK ACTIONS DATA
// ============================================================================

const quickActions: QuickAction[] = [
  {
    id: '1',
    title: 'Perfil',
    icon: 'account-circle',
    screen: 'ProfileScreen',
    color: '#007AFF',
    description: 'Gerenciar perfil'
  },
  {
    id: '2',
    title: 'Configurações',
    icon: 'cog',
    screen: 'OperatorSettingsScreen',
    color: '#34C759',
    description: 'Config. operador'
  },
  {
    id: '3',
    title: 'Conciliação',
    icon: 'file-document-multiple',
    screen: 'Conciliacao',
    color: '#FF9500',
    description: 'Conciliação avançada'
  },
  {
    id: '4',
    title: 'Importar',
    icon: 'cloud-upload',
    screen: 'Importar',
    color: '#5856D6',
    description: 'Importar dados'
  },
  {
    id: '5',
    title: 'Links Pagamento',
    icon: 'link-variant',
    screen: 'PaymentLinks',
    color: '#FF3B30',
    description: 'Gerar links'
  },
  {
    id: '6',
    title: 'Transações',
    icon: 'credit-card-multiple',
    screen: 'Transacoes',
    color: '#30D158',
    description: 'Ver transações'
  },
  {
    id: '7',
    title: 'Relatórios',
    icon: 'chart-line',
    screen: 'Relatorios',
    color: '#007AFF',
    description: 'Análises e dados'
  },
  {
    id: '8',
    title: 'EDI Teste',
    icon: 'test-tube',
    screen: 'EdiTeste',
    color: '#FF9500',
    description: 'Testes EDI'
  },
  {
    id: '9',
    title: 'Notificações',
    icon: 'bell',
    screen: 'Notificacoes',
    color: '#FF3B30',
    description: 'Central de avisos'
  },
  {
    id: '10',
    title: 'Pagamentos',
    icon: 'credit-card',
    screen: 'Pagamentos',
    color: '#34C759',
    description: 'Gestão de pagamentos'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

function HomeScreen({ navigation }: HomeScreenProps) {
  const [fetchedTransactions, setFetchedTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        setTransactionsError(null);
        const response = await fetch('http://10.1.0.171:3001/api/parse-arquivo/CIELO03_1002022022_20241218_V151039123123999.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('--- DADOS RECEBIDOS DO BACKEND ---', JSON.stringify(data, null, 2));
        setFetchedTransactions(data.transactions || []);
      } catch (error: any) {
        console.error('--- FALHA AO BUSCAR TRANSAÇÕES ---:', error);
        setTransactionsError(error.message || 'Erro ao buscar transações.');
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, []);

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalReconciled, setTotalReconciled] = useState(0);
  const [pendingReconciliations, setPendingReconciliations] = useState(0);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // NAVIGATION HANDLERS
  // --------------------------------------------------------------------------

  const handleActionPress = (screen: string) => {
    try {
      // Mapeamento de telas para navegação correta
      const screenMapping: { [key: string]: () => void } = {
        // Telas que estão no TabNavigator
        'Conciliacao': () => navigation.navigate('Conciliacao'),
        'Pagamentos': () => navigation.navigate('Pagamentos'),
        'Transacoes': () => navigation.navigate('Transacoes'),
        'EdiTeste': () => navigation.navigate('EdiTeste'),
        
        // Telas que estão no RootStack (usando navigation.getParent())
        'Importar': () => navigation.getParent()?.navigate('Importar'),
        'PaymentLinks': () => navigation.getParent()?.navigate('PaymentLinks'),
        'Notificacoes': () => navigation.getParent()?.navigate('Notificacoes'),
        'Relatorios': () => navigation.getParent()?.navigate('Relatorios'),
        
        // Telas que estão no RootStack (usando navigation.getParent())
        'ProfileScreen': () => navigation.getParent()?.navigate('ProfileScreen'),
        'OperatorSettingsScreen': () => navigation.getParent()?.navigate('OperatorSettingsScreen'),
      };

      // Executa a navegação ou mostra aviso
      if (screenMapping[screen]) {
        screenMapping[screen]();
      } else {
        showNotImplementedAlert(screen);
      }
    } catch (error) {
      console.warn(`Erro ao navegar para ${screen}:`, error);
      showNotImplementedAlert(screen);
    }
  };

  const showNotImplementedAlert = (screenName: string) => {
    console.warn(`Tela ${screenName} não implementada ainda`);
    // Você pode adicionar um Toast ou Alert aqui se desejar
    // Alert.alert('Em Desenvolvimento', `A tela ${screenName} será implementada em breve.`);
  };

  // --------------------------------------------------------------------------
  // RENDER FUNCTIONS
  // --------------------------------------------------------------------------

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.actionCard, { width: cardWidth }]}
      onPress={() => handleActionPress(action.screen)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${action.color}15` }]}>
        <Icon name={action.icon} size={28} color={action.color} />
      </View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {action.title}
      </Text>
      <Text style={styles.actionDescription} numberOfLines={1}>
        {action.description}
      </Text>
    </TouchableOpacity>
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Dashboard Component */}
      <Dashboard
        navigation={navigation.getParent() as any}
        transactions={transactions} // Esta prop 'transactions' pode precisar ser reavaliada se os dados do backend-integrator devem substituí-la ou complementá-la.
        reconciliations={reconciliations}
        totalSales={totalSales} // Similarmente, esta prop pode precisar ser recalculada com base nos dados do backend-integrator.
        totalReconciled={totalReconciled}
        pendingReconciliations={pendingReconciliations}
        processedTransactions={fetchedTransactions} // Nova prop com os dados do backend
        isLoading={isLoadingTransactions} // Nova prop para o estado de carregamento
        error={transactionsError} // Nova prop para o estado de erro
      />

      {/* Quick Actions Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <Text style={styles.sectionSubtitle}>Acesse rapidamente as principais funcionalidades</Text>
        </View>

        <View style={styles.actionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>
      </View>
    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  transactionsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  // --------------------------------------------------------------------------
  // CONTAINER STYLES
  // --------------------------------------------------------------------------
  
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  contentContainer: {
    paddingBottom: 100, // Espaço para o bottom tab
  },

  // --------------------------------------------------------------------------
  // SECTION STYLES
  // --------------------------------------------------------------------------
  
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  
  sectionHeader: {
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },

  // --------------------------------------------------------------------------
  // ACTIONS GRID STYLES
  // --------------------------------------------------------------------------
  
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  // --------------------------------------------------------------------------
  // ICON AND TEXT STYLES
  // --------------------------------------------------------------------------
  
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 20,
  },
  
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default HomeScreen;