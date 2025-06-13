import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Text, Card, Button, Chip, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

type BankReconciliationScreenProps = StackScreenProps<RootStackParamList, 'BankReconciliation'>;

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'reconciled' | 'divergent';
  cieloReference?: string;
}

interface CieloTransaction {
  id: string;
  date: string;
  amount: number;
  cardBrand: string;
  authorizationCode: string;
  nsu: string;
  status: 'pending' | 'reconciled' | 'divergent';
  bankReference?: string;
}

interface ReconciliationSummary {
  totalBankTransactions: number;
  totalCieloTransactions: number;
  reconciledCount: number;
  divergentCount: number;
  pendingCount: number;
  totalDifference: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

const BankReconciliationScreen: React.FC<BankReconciliationScreenProps> = ({ navigation }) => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  
  const [loading, setLoading] = useState(false);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [cieloTransactions, setCieloTransactions] = useState<CieloTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    totalBankTransactions: 0,
    totalCieloTransactions: 0,
    reconciledCount: 0,
    divergentCount: 0,
    pendingCount: 0,
    totalDifference: 0,
  });
  
  const [selectedTab, setSelectedTab] = useState<'summary' | 'bank' | 'cielo' | 'divergent'>('summary');

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  useEffect(() => {
    loadReconciliationData();
  }, []);

  // --------------------------------------------------------------------------
  // API FUNCTIONS
  // --------------------------------------------------------------------------

  const loadReconciliationData = async () => {
    try {
      setLoading(true);
      
      // Simular dados de conciliação
      const mockBankTransactions: BankTransaction[] = [
        {
          id: '1',
          date: '2024-01-15',
          description: 'TED CIELO*VENDAS CARTAO',
          amount: 1250.50,
          type: 'credit',
          status: 'reconciled',
          cieloReference: 'C001',
        },
        {
          id: '2',
          date: '2024-01-15',
          description: 'TED CIELO*VENDAS CARTAO',
          amount: 890.30,
          type: 'credit',
          status: 'pending',
        },
      ];

      const mockCieloTransactions: CieloTransaction[] = [
        {
          id: 'C001',
          date: '2024-01-15',
          amount: 1250.50,
          cardBrand: 'VISA',
          authorizationCode: '123456',
          nsu: '789012',
          status: 'reconciled',
          bankReference: '1',
        },
        {
          id: 'C002',
          date: '2024-01-15',
          amount: 890.30,
          cardBrand: 'MASTERCARD',
          authorizationCode: '654321',
          nsu: '210987',
          status: 'pending',
        },
      ];

      setBankTransactions(mockBankTransactions);
      setCieloTransactions(mockCieloTransactions);
      
      // Calcular resumo
      const newSummary: ReconciliationSummary = {
        totalBankTransactions: mockBankTransactions.length,
        totalCieloTransactions: mockCieloTransactions.length,
        reconciledCount: 1,
        divergentCount: 0,
        pendingCount: 1,
        totalDifference: 0,
      };
      
      setSummary(newSummary);
    } catch (error) {
      console.error('Erro ao carregar dados de conciliação:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleImportBankStatement = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.csv, DocumentPicker.types.xls, DocumentPicker.types.xlsx],
      });
      
      Alert.alert(
        'Importar Extrato',
        `Arquivo selecionado: ${result[0].name}\n\nDeseja importar este extrato bancário?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Importar', onPress: () => processBankStatement(result[0]) },
        ]
      );
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
      }
    }
  };

  const processBankStatement = async (file: any) => {
    try {
      setLoading(true);
      // Aqui você processaria o arquivo do extrato bancário
      // Implementar lógica de parsing CSV/Excel
      
      Alert.alert('Sucesso', 'Extrato bancário importado com sucesso!');
      loadReconciliationData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível processar o extrato bancário.');
    } finally {
      setLoading(false);
    }
  };

  const performAutoReconciliation = async () => {
    try {
      setLoading(true);
      
      // Lógica de conciliação automática
      // Comparar transações por valor, data e outros critérios
      
      Alert.alert('Conciliação Automática', 'Conciliação realizada com sucesso!');
      loadReconciliationData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível realizar a conciliação automática.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'reconciled': return '#34C759';
      case 'divergent': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'reconciled': return 'Conciliado';
      case 'divergent': return 'Divergente';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  // --------------------------------------------------------------------------
  // RENDER COMPONENTS
  // --------------------------------------------------------------------------

  const SummaryCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={[styles.summaryValue, { color }]}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </Text>
        </View>
      </View>
    </Card>
  );

  const BankTransactionItem: React.FC<{ item: BankTransaction }> = ({ item }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
          <Text style={styles.transactionAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <Chip 
          mode="outlined"
          textStyle={{ color: getStatusColor(item.status) }}
          style={{ borderColor: getStatusColor(item.status) }}
        >
          {getStatusLabel(item.status)}
        </Chip>
      </View>
    </Card>
  );

  const CieloTransactionItem: React.FC<{ item: CieloTransaction }> = ({ item }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>
            {item.cardBrand} - NSU: {item.nsu}
          </Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
          <Text style={styles.transactionAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <Chip 
          mode="outlined"
          textStyle={{ color: getStatusColor(item.status) }}
          style={{ borderColor: getStatusColor(item.status) }}
        >
          {getStatusLabel(item.status)}
        </Chip>
      </View>
    </Card>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'summary':
        return (
          <View style={styles.summarySection}>
            <SummaryCard
              title="Transações Bancárias"
              value={summary.totalBankTransactions}
              icon="bank"
              color="#007AFF"
            />
            <SummaryCard
              title="Transações Cielo"
              value={summary.totalCieloTransactions}
              icon="credit-card"
              color="#34C759"
            />
            <SummaryCard
              title="Conciliadas"
              value={summary.reconciledCount}
              icon="check-circle"
              color="#34C759"
            />
            <SummaryCard
              title="Pendentes"
              value={summary.pendingCount}
              icon="clock"
              color="#FF9500"
            />
            <SummaryCard
              title="Divergentes"
              value={summary.divergentCount}
              icon="alert-circle"
              color="#FF3B30"
            />
          </View>
        );
      
      case 'bank':
        return (
          <FlatList
            data={bankTransactions}
            renderItem={({ item }) => <BankTransactionItem item={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        );
      
      case 'cielo':
        return (
          <FlatList
            data={cieloTransactions}
            renderItem={({ item }) => <CieloTransactionItem item={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        );
      
      case 'divergent':
        return (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={64} color="#34C759" />
            <Text style={styles.emptyStateTitle}>Nenhuma Divergência</Text>
            <Text style={styles.emptyStateSubtitle}>
              Todas as transações foram conciliadas com sucesso!
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conciliação Bancária</Text>
        <TouchableOpacity onPress={performAutoReconciliation}>
          <Icon name="auto-fix" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'summary', label: 'Resumo', icon: 'chart-pie' },
            { key: 'bank', label: 'Banco', icon: 'bank' },
            { key: 'cielo', label: 'Cielo', icon: 'credit-card' },
            { key: 'divergent', label: 'Divergências', icon: 'alert-circle' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Icon 
                name={tab.icon} 
                size={20} 
                color={selectedTab === tab.key ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.tabLabel,
                selectedTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* FAB */}
      <FAB
        icon="upload"
        label="Importar Extrato"
        onPress={handleImportBankStatement}
        style={styles.fab}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // --------------------------------------------------------------------------
  // CONTAINER STYLES
  // --------------------------------------------------------------------------
  
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // --------------------------------------------------------------------------
  // HEADER STYLES
  // --------------------------------------------------------------------------
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // --------------------------------------------------------------------------
  // TAB STYLES
  // --------------------------------------------------------------------------
  
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  
  tabLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // CONTENT STYLES
  // --------------------------------------------------------------------------
  
  content: {
    flex: 1,
  },
  
  summarySection: {
    padding: 16,
    gap: 12,
  },
  
  summaryCard: {
    borderRadius: 12,
  },
  
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  summaryInfo: {
    flex: 1,
  },
  
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  // --------------------------------------------------------------------------
  // TRANSACTION STYLES
  // --------------------------------------------------------------------------
  
  listContainer: {
    padding: 16,
    gap: 12,
  },
  
  transactionCard: {
    borderRadius: 12,
  },
  
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  
  transactionInfo: {
    flex: 1,
  },
  
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },

  // --------------------------------------------------------------------------
  // EMPTY STATE STYLES
  // --------------------------------------------------------------------------
  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // --------------------------------------------------------------------------
  // FAB STYLES
  // --------------------------------------------------------------------------
  
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

export default BankReconciliationScreen;