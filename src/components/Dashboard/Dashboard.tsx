import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Card, Title, Paragraph, IconButton } from 'react-native-paper'; // Adicionado IconButton
import { RootStackParamList, Transaction, Reconciliation } from '../../types';

interface DashboardProps {
  transactions: Transaction[];
  reconciliations: Reconciliation[];
  totalSales: number;
  totalReconciled: number;
  pendingReconciliations: number;
  navigation: StackNavigationProp<RootStackParamList>; 
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  reconciliations,
  totalSales,
  totalReconciled,
  pendingReconciliations,
  navigation
}) => {
  const getSalesByType = (type: string) => {
    return transactions.filter(t => t.type === type).reduce(
      (sum, t) => sum + t.amount,
      0
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Resumo do Dia</Title>
      </View>

      <View style={styles.metricsContainer}>
        <Card style={styles.metricCard}>
          <Title style={styles.metricCardTitle}>Vendas</Title>
          <Paragraph style={styles.metricCardValue}>R$ {totalSales.toFixed(2)}</Paragraph>
        </Card>

        <Card style={styles.metricCard}>
          <Title style={styles.metricCardTitle}>Conciliado</Title>
          <Paragraph style={styles.metricCardValue}>R$ {totalReconciled.toFixed(2)}</Paragraph>
        </Card>

        <Card style={styles.metricCard}>
          <Title style={styles.metricCardTitle}>Pendentes</Title>
          <Paragraph style={styles.metricCardValue}>{pendingReconciliations}</Paragraph>
        </Card>
      </View>

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Vendas por Forma de Pagamento</Title>
        <View style={styles.paymentStats}>
          <Card style={styles.paymentCard}>
            <Title style={styles.paymentCardTitle}>Crédito</Title>
            <Paragraph style={styles.paymentCardValue}>R$ {getSalesByType('credit').toFixed(2)}</Paragraph>
          </Card>
          <Card style={styles.paymentCard}>
            <Title style={styles.paymentCardTitle}>Débito</Title>
            <Paragraph style={styles.paymentCardValue}>R$ {getSalesByType('debit').toFixed(2)}</Paragraph>
          </Card>
          <Card style={styles.paymentCard}>
            <Title style={styles.paymentCardTitle}>Pix</Title>
            <Paragraph style={styles.paymentCardValue}>R$ {getSalesByType('pix').toFixed(2)}</Paragraph>
          </Card>
        </View>
      </View>

      {/* Nova Seção de Ações Rápidas */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Ações Rápidas</Title>
        <View style={styles.actionsContainer}>
          
          <Card style={styles.actionCard}>
            <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')} style={styles.touchableCardContent}>
              <IconButton icon="bell-outline" size={30} iconColor="#0A4F6A" />
              <Title style={styles.actionCardTitle}>Notificações</Title>
            </TouchableOpacity>
          </Card>

          <Card style={styles.actionCard}>
            <TouchableOpacity onPress={() => navigation.navigate('Relatorios')} style={styles.touchableCardContent}>
              <IconButton icon="chart-bar" size={30} iconColor="#0A4F6A" />
              <Title style={styles.actionCardTitle}>Relatórios</Title>
            </TouchableOpacity>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Main background (light gray)
  },
  header: { // Container for the main title "Resumo do Dia"
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerTitle: { // Style for "Resumo do Dia"
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A4F6A', // Primary color (Azul Petróleo)
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingHorizontal: 8, // Reduced as cards have margins
    paddingVertical: 15,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4013e3', // White card background
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginTop: 15,
  },
  metricCardTitle: {
    fontSize: 25,
    color: '#fffcfc', // Secondary text color
    marginBottom: 4,
    textAlign: 'center',
  },
  metricCardValue: {
    fontSize: 25, // Reduced size
    fontWeight: 'bold',
    color: '#f9f9f9', // Primary color (Azul Petróleo)
    marginTop: 18,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20, // More space before section title
    paddingBottom: 16,
    marginTop: 8, // Reduced space between sections if header has bottom padding
  },
  sectionTitle: {
    fontSize: 20, // Slightly smaller section titles
    fontWeight: 'bold',
    color: '#0A4F6A', // Primary color
    marginBottom: 12, // Space below title
  },
  paymentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentCard: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 16,
    paddingHorizontal: 12, // Adjust padding for content
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  paymentCardTitle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
    textAlign: 'center',
  },
  paymentCardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333', // Darker text for payment values
    marginTop: 4,
  },
  // Estilos para os cards de ação
  actionsContainer: {
    marginTop: 8,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  touchableCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionCardTitle: {
    fontSize: 17,
    color: '#333333',
    marginLeft: 12,
    fontWeight: '500',
  },
  // Estilos de transação removidos (transactionCard, transactionContent, etc.)
});
