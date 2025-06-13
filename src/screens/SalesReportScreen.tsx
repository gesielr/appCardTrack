import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, Card, Button, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

type SalesReportScreenProps = StackScreenProps<RootStackParamList, 'SalesReport'>;

interface SalesData {
  totalSales: number;
  creditSales: number;
  debitSales: number;
  pixSales: number;
  installmentSales: number;
  totalFees: number;
  netAmount: number;
  transactionCount: number;
}

interface PeriodFilter {
  type: 'day' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
}

const { width } = Dimensions.get('window');

// ============================================================================
// COMPONENT
// ============================================================================

const SalesReportScreen: React.FC<SalesReportScreenProps> = ({ navigation }) => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    creditSales: 0,
    debitSales: 0,
    pixSales: 0,
    installmentSales: 0,
    totalFees: 0,
    netAmount: 0,
    transactionCount: 0,
  });
  
  const [filter, setFilter] = useState<PeriodFilter>({
    type: 'day',
    startDate: new Date(),
    endDate: new Date(),
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  useEffect(() => {
    loadSalesData();
  }, [filter]);

  // --------------------------------------------------------------------------
  // API FUNCTIONS
  // --------------------------------------------------------------------------

  const loadSalesData = async () => {
    try {
      setLoading(true);
      
      // Simular chamada API para dados de vendas
      const mockData: SalesData = {
        totalSales: 45680.50,
        creditSales: 28500.30,
        debitSales: 12180.20,
        pixSales: 5000.00,
        installmentSales: 18200.40,
        totalFees: 1250.75,
        netAmount: 44429.75,
        transactionCount: 156,
      };
      
      setSalesData(mockData);
    } catch (error) {
      console.error('Erro ao carregar dados de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handlePeriodChange = (value: string) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (value) {
      case 'day':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        break;
    }

    setFilter({
      type: value as 'day' | 'month' | 'year',
      startDate,
      endDate,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilter(prev => ({
        ...prev,
        [datePickerMode === 'start' ? 'startDate' : 'endDate']: selectedDate,
      }));
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  // --------------------------------------------------------------------------
  // RENDER COMPONENTS
  // --------------------------------------------------------------------------

  const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: string;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card style={styles.metricCard}>
      <View style={styles.metricContent}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Card>
  );

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatório de Vendas</Text>
        <TouchableOpacity onPress={() => {}}>
          <Icon name="download" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Período de Análise</Text>
        
        <SegmentedButtons
          value={filter.type}
          onValueChange={handlePeriodChange}
          buttons={[
            { value: 'day', label: 'Dia' },
            { value: 'month', label: 'Mês' },
            { value: 'year', label: 'Ano' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.dateRange}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => {
              setDatePickerMode('start');
              setShowDatePicker(true);
            }}
          >
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.dateText}>{formatDate(filter.startDate)}</Text>
          </TouchableOpacity>
          
          <Text style={styles.dateSeparator}>até</Text>
          
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => {
              setDatePickerMode('end');
              setShowDatePicker(true);
            }}
          >
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.dateText}>{formatDate(filter.endDate)}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Sales Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumo de Vendas</Text>
        
        <MetricCard
          title="Total de Vendas"
          value={formatCurrency(salesData.totalSales)}
          icon="trending-up"
          color="#007AFF"
          subtitle={`${salesData.transactionCount} transações`}
        />

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Crédito"
            value={formatCurrency(salesData.creditSales)}
            icon="credit-card"
            color="#34C759"
          />
          
          <MetricCard
            title="Débito"
            value={formatCurrency(salesData.debitSales)}
            icon="card"
            color="#FF9500"
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="PIX"
            value={formatCurrency(salesData.pixSales)}
            icon="bank-transfer"
            color="#5856D6"
          />
          
          <MetricCard
            title="Parcelado"
            value={formatCurrency(salesData.installmentSales)}
            icon="credit-card-multiple"
            color="#FF3B30"
          />
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.financialSection}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
        
        <Card style={styles.financialCard}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Vendas Brutas:</Text>
            <Text style={styles.financialValue}>{formatCurrency(salesData.totalSales)}</Text>
          </View>
          
          <View style={styles.financialRow}>
            <Text style={[styles.financialLabel, styles.feeLabel]}>(-) Taxas:</Text>
            <Text style={[styles.financialValue, styles.feeValue]}>
              {formatCurrency(salesData.totalFees)}
            </Text>
          </View>
          
          <View style={[styles.financialRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Valor Líquido:</Text>
            <Text style={styles.totalValue}>{formatCurrency(salesData.netAmount)}</Text>
          </View>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('DetailedReport')}
          style={styles.actionButton}
          labelStyle={styles.actionButtonText}
        >
          Ver Relatório Detalhado
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Reconciliation')}
          style={styles.actionButton}
          labelStyle={styles.outlineButtonText}
        >
          Conciliar com Extrato
        </Button>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? filter.startDate : filter.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
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
  
  contentContainer: {
    paddingBottom: 100,
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
  // FILTER STYLES
  // --------------------------------------------------------------------------
  
  filterCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  
  segmentedButtons: {
    marginBottom: 16,
  },
  
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    flex: 1,
  },
  
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  
  dateSeparator: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#666',
  },

  // --------------------------------------------------------------------------
  // METRICS STYLES
  // --------------------------------------------------------------------------
  
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  
  metricCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  metricInfo: {
    flex: 1,
  },
  
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },

  // --------------------------------------------------------------------------
  // FINANCIAL STYLES
  // --------------------------------------------------------------------------
  
  financialSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  
  financialCard: {
    padding: 16,
    borderRadius: 12,
  },
  
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  
  financialValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  
  feeLabel: {
    color: '#FF3B30',
  },
  
  feeValue: {
    color: '#FF3B30',
  },
  
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTop: 12,
  },
  
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },

  // --------------------------------------------------------------------------
  // ACTIONS STYLES
  // --------------------------------------------------------------------------
  
  actionsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  
  actionButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default SalesReportScreen;