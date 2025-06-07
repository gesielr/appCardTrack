import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, DataTable } from 'react-native-paper';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import { Transaction, Reconciliation } from '../../types';

interface ReportsScreenProps {
  navigation: any;
}

interface ReportFilter {
  startDate: string;
  endDate: string;
  type: 'daily' | 'weekly' | 'monthly';
  status: string[];
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ReportFilter>({
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    type: 'daily',
    status: ['completed', 'pending'],
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', selectedFilter.startDate)
        .lte('created_at', selectedFilter.endDate)
        .in('status', selectedFilter.status);

      if (error) throw error;
      
      const groupedReports = generateReports(data);
      setReports(groupedReports);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os relatórios');
    } finally {
      setLoading(false);
    }
  };

  const generateReports = (transactions: Transaction[]): Report[] => {
    const reports: Report[] = [];
    const grouped = new Map<string, Report>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          totalTransactions: 0,
          totalAmount: 0,
          averageTicket: 0,
          byPaymentMethod: {
            credit: 0,
            debit: 0,
            pix: 0,
          },
          byStatus: {
            completed: 0,
            pending: 0,
            canceled: 0,
          },
        });
      }

      const report = grouped.get(key)!;
      report.totalTransactions++;
      report.totalAmount += transaction.amount;
      report.byPaymentMethod[transaction.type as keyof typeof report.byPaymentMethod]++;
      report.byStatus[transaction.status as keyof typeof report.byStatus]++;
      report.averageTicket = report.totalAmount / report.totalTransactions;
    });

    grouped.forEach((report) => reports.push(report));
    return reports;
  };

  const exportToExcel = async () => {
    try {
      const ws = XLSX.utils.json_to_sheet(reports);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      
      const filename = `relatorio_${new Date().toISOString()}.xlsx`;
      const file = await FileSystem.writeAsStringAsync(
        `${FileSystem.documentDirectory}${filename}`,
        XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      Alert.alert('Sucesso!', 'Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      Alert.alert('Erro', 'Não foi possível exportar o relatório');
    }
  };

  const renderReport = (report: Report) => (
    <Card key={report.date} style={styles.card}>
      <Card.Content>
        <Title>Data: {new Date(report.date).toLocaleDateString()}</Title>
        <DataTable>
          <DataTable.Row>
            <DataTable.Cell>Total de Transações</DataTable.Cell>
            <DataTable.Cell>{report.totalTransactions}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Valor Total</DataTable.Cell>
            <DataTable.Cell>R$ {report.totalAmount.toFixed(2)}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Ticket Médio</DataTable.Cell>
            <DataTable.Cell>R$ {report.averageTicket.toFixed(2)}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Cartão de Crédito</DataTable.Cell>
            <DataTable.Cell>{report.byPaymentMethod.credit}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Cartão de Débito</DataTable.Cell>
            <DataTable.Cell>{report.byPaymentMethod.debit}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Pix</DataTable.Cell>
            <DataTable.Cell>{report.byPaymentMethod.pix}</DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.filterCard}>
        <Card.Content>
          <Title>Filtros</Title>
          <Button onPress={fetchReports} style={styles.button}>
            Atualizar Relatório
          </Button>
          <Button onPress={exportToExcel} style={styles.button}>
            Exportar para Excel
          </Button>
        </Card.Content>
      </Card>

      {reports.map((report) => renderReport(report))}
    </ScrollView>
  );
};

interface Report {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  averageTicket: number;
  byPaymentMethod: {
    credit: number;
    debit: number;
    pix: number;
  };
  byStatus: {
    completed: number;
    pending: number;
    canceled: number;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  filterCard: {
    marginBottom: 16,
  },
  button: {
    marginVertical: 8,
  },
  dataCell: {
    padding: 8,
  },
});

export default ReportsScreen;
