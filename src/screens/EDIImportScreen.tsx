// src/screens/EDIImportScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Button, ProgressBar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import RNFS from 'react-native-fs';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { EDIFile, ProcessedEDI } from 'backend-integrator/types/edi';
import { EDIParser } from 'backend-integrator/src/services/edi-parser';
import { supabase } from '../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

type EDIImportScreenProps = StackScreenProps<RootStackParamList, 'EDIImport'>;

// ============================================================================
// COMPONENT
// ============================================================================

const EDIImportScreen: React.FC<EDIImportScreenProps> = ({ navigation }) => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ediFiles, setEdiFiles] = useState<EDIFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<EDIFile | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedEDI | null>(null);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  useEffect(() => {
    loadEDIFiles();
  }, []);

  // --------------------------------------------------------------------------
  // API FUNCTIONS
  // --------------------------------------------------------------------------

  const loadEDIFiles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('edi_files')
        .select('*')
        .order('upload_date', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar arquivos EDI:', error);
        return;
      }
      
      setEdiFiles(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos EDI:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEDIFile = async (ediFile: EDIFile, processedData: ProcessedEDI) => {
    try {
      // Salvar arquivo EDI
      const { error: fileError } = await supabase
        .from('edi_files')
        .insert([{
          id: ediFile.id,
          file_name: ediFile.fileName,
          file_size: ediFile.fileSize,
          upload_date: ediFile.uploadDate,
          processed_date: ediFile.processedDate,
          status: ediFile.status,
          record_count: ediFile.recordCount,
          establishment_code: ediFile.establishmentCode,
          processing_date: ediFile.processingDate,
        }]);

      if (fileError) throw fileError;

      // Salvar transações
      const transactionsToInsert = processedData.transactions.map(transaction => ({
        edi_file_id: ediFile.id,
        establishment_code: transaction.establishmentCode,
        transaction_date: transaction.transactionDate,
        sale_date: transaction.saleDate,
        product: transaction.product,
        modality: transaction.modality,
        gross_amount: transaction.grossAmount,
        discount_amount: transaction.discountAmount,
        net_amount: transaction.netAmount,
        installments: transaction.installments,
        card_brand: transaction.cardBrand,
        authorization_code: transaction.authorizationCode,
        nsu: transaction.nsu,
        tid: transaction.tid,
        status: transaction.status,
      }));

      const { error: transactionsError } = await supabase
        .from('edi_transactions')
        .insert(transactionsToInsert);

      if (transactionsError) throw transactionsError;

    } catch (error) {
      console.error('Erro ao salvar dados EDI:', error);
      throw error;
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        // Usuário cancelou a seleção
        return;
      }

      const file = result.assets[0];

      // Validar extensão do arquivo
      if (!file.name?.toLowerCase().endsWith('.txt') && !file.name?.toLowerCase().endsWith('.edi')) {
        Alert.alert('Erro', 'Por favor, selecione um arquivo EDI (.txt ou .edi)');
        return;
      }

      Alert.alert(
        'Importar Arquivo EDI',
        `Arquivo: ${file.name}\nTamanho: ${(file.size! / 1024).toFixed(2)} KB\n\nDeseja importar este arquivo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Importar', onPress: () => processEDIFile(file) },
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo.');
    }
  };

  const processEDIFile = async (file: any) => {
    try {
      setImporting(true);
      setProgress(0);

      // Ler arquivo
      setProgress(0.2);
      const fileContent = await RNFS.readFile(file.fileCopyUri, 'utf8');
      
      // Parse do arquivo EDI
      setProgress(0.4);
      const processedData = EDIParser.parseEDIFile(fileContent);
      
      // Criar objeto EDIFile
      setProgress(0.6);
      const ediFile: EDIFile = {
        id: `edi_${Date.now()}`,
        fileName: file.name!,
        fileSize: file.size!,
        uploadDate: new Date().toISOString(),
        processedDate: new Date().toISOString(),
        status: 'completed',
        recordCount: processedData.transactions.length,
        establishmentCode: processedData.header.establishmentCode,
        processingDate: processedData.header.processingDate,
      };

      // Salvar no banco
      setProgress(0.8);
      await saveEDIFile(ediFile, processedData);
      
      setProgress(1.0);
      setProcessedData(processedData);
      setSelectedFile(ediFile);
      
      Alert.alert(
        'Sucesso!',
        `Arquivo EDI importado com sucesso!\n\n` +
        `Transações: ${processedData.transactions.length}\n` +
        `Valor Total: ${formatCurrency(processedData.summary.totalGrossAmount)}\n` +
        `Data: ${EDIParser.formatEDIDate(processedData.header.processingDate)}`
      );
      
      // Recarregar lista
      loadEDIFiles();
      
    } catch (error) {
      console.error('Erro ao processar arquivo EDI:', error);
      Alert.alert('Erro', `Não foi possível processar o arquivo EDI:\n\n${error}`);
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  const viewFileDetails = (file: EDIFile) => {
    navigation.navigate('EDIDetails', { fileId: file.id });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'processing': return '#FF9500';
      case 'error': return '#FF3B30';
      case 'pending': return '#007AFF';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed': return 'Processado';
      case 'processing': return 'Processando';
      case 'error': return 'Erro';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  // --------------------------------------------------------------------------
  // RENDER COMPONENTS
  // --------------------------------------------------------------------------

  const SummaryCard: React.FC<{
    title: string;
    value: string;
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
          <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        </View>
      </View>
    </Card>
  );

  const FileItem: React.FC<{ item: EDIFile }> = ({ item }) => (
    <Card style={styles.fileCard}>
      <TouchableOpacity 
        style={styles.fileContent}
        onPress={() => viewFileDetails(item)}
      >
        <View style={styles.fileInfo}>
          <View style={styles.fileHeader}>
            <Icon name="file-document" size={24} color="#007AFF" />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{item.fileName}</Text>
              <Text style={styles.fileDate}>
                {new Date(item.uploadDate).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
          
          <View style={styles.fileStats}>
            <Text style={styles.fileStatsText}>
              {item.recordCount} transações • {(item.fileSize / 1024).toFixed(2)} KB
            </Text>
            <Text style={styles.establishmentCode}>
              Estabelecimento: {item.establishmentCode}
            </Text>
          </View>
        </View>
        
        <View style={styles.fileActions}>
          <Chip 
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={{ borderColor: getStatusColor(item.status) }}
          >
            {getStatusLabel(item.status)}
          </Chip>
          <Icon name="chevron-right" size={24} color="#999" />
        </View>
      </TouchableOpacity>
    </Card>
  );

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
        <Text style={styles.headerTitle}>Importar EDI Cielo</Text>
        <TouchableOpacity onPress={handleSelectFile}>
          <Icon name="plus" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Import Progress */}
        {importing && (
          <Card style={styles.progressCard}>
            <View style={styles.progressContent}>
              <Text style={styles.progressTitle}>Importando arquivo EDI...</Text>
              <ProgressBar 
                progress={progress} 
                color="#007AFF" 
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}% concluído
              </Text>
            </View>
          </Card>
        )}

        {/* Summary */}
        {processedData && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Último Arquivo Processado</Text>
            
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Total de Transações"
                value={processedData.summary.totalTransactions.toString()}
                icon="receipt"
                color="#007AFF"
              />
              
              <SummaryCard
                title="Valor Bruto"
                value={formatCurrency(processedData.summary.totalGrossAmount)}
                icon="trending-up"
                color="#34C759"
              />
            </View>

            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Crédito"
                value={`${processedData.summary.creditTransactions} transações`}
                icon="credit-card"
                color="#FF9500"
              />
              
              <SummaryCard
                title="Débito"
                value={`${processedData.summary.debitTransactions} transações`}
                icon="card"
                color="#5856D6"
              />
            </View>
          </View>
        )}

        {/* Files List */}
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Arquivos EDI Importados</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando arquivos...</Text>
            </View>
          ) : ediFiles.length > 0 ? (
            <FlatList
              data={ediFiles}
              renderItem={({ item }) => <FileItem item={item} />}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Icon name="file-upload" size={64} color="#999" />
                <Text style={styles.emptyTitle}>Nenhum arquivo EDI</Text>
                <Text style={styles.emptySubtitle}>
                  Toque no botão + para importar seu primeiro arquivo EDI da Cielo
                </Text>
                <Button
                  mode="contained"
                  onPress={handleSelectFile}
                  style={styles.emptyButton}
                >
                  Importar Arquivo
                </Button>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
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

  content: {
    flex: 1,
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
  // PROGRESS STYLES
  // --------------------------------------------------------------------------
  
  progressCard: {
    margin: 16,
    borderRadius: 12,
  },
  
  progressContent: {
    padding: 20,
    alignItems: 'center',
  },
  
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  
  progressText: {
    fontSize: 14,
    color: '#666',
  },

  // --------------------------------------------------------------------------
  // SUMMARY STYLES
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
  
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  summaryInfo: {
    flex: 1,
  },
  
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // FILES STYLES
  // --------------------------------------------------------------------------
  
  filesSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  
  fileCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  fileInfo: {
    flex: 1,
  },
  
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  
  fileDate: {
    fontSize: 12,
    color: '#666',
  },
  
  fileStats: {
    marginTop: 4,
  },
  
  fileStatsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  
  establishmentCode: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  fileActions: {
    alignItems: 'center',
    gap: 8,
  },

  // --------------------------------------------------------------------------
  // LOADING & EMPTY STYLES
  // --------------------------------------------------------------------------
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  
  emptyCard: {
    borderRadius: 12,
  },
  
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  
  emptyButton: {
    borderRadius: 12,
  },
});

export default EDIImportScreen;