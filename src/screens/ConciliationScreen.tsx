// src/screens/ConciliationScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/core';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../types';

type ConciliationFile = {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
  operator: string;
  transaction_count: number;
  processed_at: string | null;
  error_message: string | null;
};

export default function ConciliationScreen() {
  const [files, setFiles] = useState<ConciliationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Conciliacao'>>();

  useEffect(() => {
    fetchConciliationFiles();
  }, []);

  async function fetchConciliationFiles() {
    try {
      setLoading(true);
      
      // Buscar arquivos de conciliação do usuário
      const { data, error } = await supabase
        .from('conciliation_files')
        .select(`
          id, 
          file_name, 
          created_at, 
          status, 
          operator,
          transaction_count,
          processed_at,
          error_message
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching conciliation files:', error);
      alert('Erro ao carregar arquivos de conciliação');
    } finally {
      setLoading(false);
    }
  }

  function viewFileDetails(fileId: string) {
    navigation.navigate('Transacoes', { 
      conciliationFileId: fileId 
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Verde
      case 'processing':
        return '#2196F3'; // Azul
      case 'error':
        return '#F44336'; // Vermelho
      default:
        return '#9E9E9E'; // Cinza
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  }

  function renderOperatorIcon(operator: string) {
    // Implementar ícones para cada operadora
    switch (operator.toLowerCase()) {
      case 'cielo':
        return '🔵'; // Substitua por um componente de ícone real
      case 'stone':
        return '🟢'; // Substitua por um componente de ícone real
      case 'rede':
        return '🔴'; // Substitua por um componente de ícone real
      default:
        return '⚪'; // Substitua por um componente de ícone real
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Arquivos de Conciliação</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchConciliationFiles}
        >
          <Text>🔄 Atualizar</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Carregando arquivos...</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.fileCard,
                { borderLeftColor: getStatusColor(item.status) }
              ]}
              onPress={() => viewFileDetails(item.id)}
            >
              <View style={styles.fileHeader}>
                <Text style={styles.fileName}>
                  {renderOperatorIcon(item.operator)} {item.file_name}
                </Text>
                <Text style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) }
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.fileDetails}>
                <Text>Operadora: {item.operator}</Text>
                <Text>Transações: {item.transaction_count || 0}</Text>
                <Text>Criado em: {formatDate(item.created_at)}</Text>
                {item.processed_at && (
                  <Text>Processado em: {formatDate(item.processed_at)}</Text>
                )}
                {item.error_message && (
                  <Text style={styles.errorMessage}>
                    Erro: {item.error_message}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum arquivo de conciliação encontrado
              </Text>
              <Text style={styles.emptySubtext}>
                Os arquivos de conciliação serão exibidos aqui após o processamento.
              </Text>
            </View>
          }
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fileDetails: {
    marginTop: 8,
  },
  errorMessage: {
    color: '#F44336',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#9E9E9E',
  },
});