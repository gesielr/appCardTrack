import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList, Transaction, Reconciliation } from '../../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface DashboardProps {
  transactions: Transaction[];
  reconciliations: Reconciliation[];
  totalSales: number;
  totalReconciled: number;
  pendingReconciliations: number;
  navigation: StackNavigationProp<RootStackParamList>; 
  processedTransactions?: TransactionData[];
  isLoading?: boolean;
  error?: string | null;
}

interface TransactionData {
  id?: string; 
  transaction_type: string; 
  amount: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  backgroundColor: string;
}

interface PaymentMethodProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface AggregatedSales {
  totalAmount: number;
  count: number;
}

const { width } = Dimensions.get('window');

// ============================================================================
// COMPONENT
// ============================================================================

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  reconciliations,
  totalSales,
  totalReconciled,
  pendingReconciliations,
  navigation,
  processedTransactions = [],
  isLoading = false,
  error = null
}) => {
  
  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------
  
  const getSalesByType = (type: string): number => {
    return transactions.filter(t => t.type === type).reduce(
      (sum, t) => sum + t.amount,
      0
    );
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAggregatedSalesByType = useMemo(() => (type: string): AggregatedSales => {
    if (!processedTransactions || processedTransactions.length === 0) {
      return { totalAmount: 0, count: 0 };
    }
    const filteredTransactions = processedTransactions.filter(t => t.transaction_type.toLowerCase() === type);
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const count = filteredTransactions.length;
    return { totalAmount, count };
  }, [processedTransactions]);

  const formatAggregatedSales = (sales: AggregatedSales): string => {
    return `${formatCurrency(sales.totalAmount)} (${sales.count} ops)`;
  };

  // --------------------------------------------------------------------------
  // RENDER COMPONENTS
  // --------------------------------------------------------------------------

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, backgroundColor }) => (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );

  const PaymentMethodCard: React.FC<PaymentMethodProps> = ({ title, value, icon, color }) => (
    <View style={styles.paymentCard}>
      <View style={[styles.paymentIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.paymentTitle}>{title}</Text>
      <Text style={styles.paymentValue}>{value}</Text>
    </View>
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumo do Dia</Text>
        <Text style={styles.headerSubtitle}>Acompanhe suas métricas em tempo real</Text>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="Vendas"
          value={formatCurrency(totalSales)}
          icon="trending-up"
          color="#007AFF"
          backgroundColor="#007AFF"
        />
        
        <MetricCard
          title="Conciliado"
          value={formatCurrency(totalReconciled)}
          icon="check-circle"
          color="#34C759"
          backgroundColor="#34C759"
        />
        
        <MetricCard
          title="Pendentes"
          value={pendingReconciliations.toString()}
          icon="clock"
          color="#FF9500"
          backgroundColor="#FF9500"
        />
      </View>

      {/* Payment Methods Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendas por Forma de Pagamento</Text>
          <Text style={styles.sectionSubtitle}>Distribuição dos métodos de pagamento</Text>
        </View>
        
        <View style={styles.paymentMethodsContainer}>
          {isLoading && <ActivityIndicator size="large" color="#007AFF" />}
          {error && <Text style={styles.errorText}>Erro ao carregar dados: {error}</Text>}
          {!isLoading && !error && (
            <React.Fragment>
          <PaymentMethodCard
            title="Crédito"
            value={formatAggregatedSales(getAggregatedSalesByType('credit'))}
            icon="credit-card"
            color="#007AFF"
          />
          
          <PaymentMethodCard
            title="Débito"
            value={formatAggregatedSales(getAggregatedSalesByType('debit'))}
            icon="card"
            color="#34C759"
          />
          
          <PaymentMethodCard
            title="PIX"
            value={formatAggregatedSales(getAggregatedSalesByType('parcelado'))}
            icon="bank-transfer"
            color="#FF9500"
          />
            </React.Fragment>
          )}
          {/* End of loading/error wrapper */}
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  // --------------------------------------------------------------------------
  // CONTAINER STYLES
  // --------------------------------------------------------------------------
  
  container: {
    backgroundColor: '#F8F9FA',
    paddingBottom: 16,
  },

  // --------------------------------------------------------------------------
  // HEADER STYLES
  // --------------------------------------------------------------------------
  
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
  },

  // --------------------------------------------------------------------------
  // METRICS STYLES
  // --------------------------------------------------------------------------
  
  metricsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  
  metricCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  metricTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // --------------------------------------------------------------------------
  // SECTION STYLES
  // --------------------------------------------------------------------------
  
  section: {
    paddingHorizontal: 16,
  },

  sectionHeader: {
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
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
  // PAYMENT METHODS STYLES
  // --------------------------------------------------------------------------
  
  paymentMethodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  paymentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  
  paymentTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});