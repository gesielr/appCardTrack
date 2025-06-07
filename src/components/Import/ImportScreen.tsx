import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../types';

interface ImportScreenProps {
  navigation: any;
}

const ImportScreen: React.FC<ImportScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [importingFile, setImportingFile] = useState<string | null>(null);

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'application/octet-stream'],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImportingFile(asset.name);
        setLoading(true);

        // Processar o arquivo
        const fileContent = await FileSystem.readAsStringAsync(asset.uri);
        // Passando o mimeType para a função processFile, se necessário, ou asset.name para inferir o tipo
        const transactions = await processFile(fileContent, asset.mimeType || asset.name);

        // Salvar no Supabase
        const { error } = await supabase
          .from('transactions')
          .insert(transactions);

        if (error) throw error;

        Alert.alert('Sucesso!', 'Arquivo importado com sucesso!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao importar o arquivo');
      console.error('Erro ao importar arquivo:', error);
    } finally {
      setLoading(false);
      setImportingFile(null);
    }
  };

  const getTransactionType = (csvType: string): 'credit' | 'debit' | 'pix' => {
    const lowerCaseType = csvType.toLowerCase().trim();
    if (lowerCaseType === 'crédito' || lowerCaseType === 'credit') {
      return 'credit';
    }
    if (lowerCaseType === 'débito' || lowerCaseType === 'debit') {
      return 'debit';
    }
    if (lowerCaseType === 'pix') {
      return 'pix';
    }
    // Se não corresponder, pode retornar um padrão ou lançar um erro
    // Aqui, vamos assumir 'credit' como padrão ou você pode ajustar
    console.warn(`Tipo de transação não reconhecido: ${csvType}, usando 'credit' como padrão.`);
    return 'credit'; // Ou lançar erro: throw new Error(`Tipo de transação inválido: ${csvType}`);
  };

  const processFile = async (content: string, fileMimeTypeOrName: string): Promise<Transaction[]> => {
    let transactions: Transaction[] = [];

    try {
      // Processar CSV
      if (fileMimeTypeOrName.includes('csv')) { // Verifica se o nome/tipo do arquivo indica CSV
        const lines = content.split('\n');
        for (const line of lines) {
          const columns = line.split(',');
          if (columns.length < 4) continue; // Pula linhas malformadas

          const date = columns[0];
          const description = columns[1];
          const amount = parseFloat(columns[2]);
          const rawType = columns[3];
          const transactionType = getTransactionType(rawType);

          transactions.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // ID mais único
            date,
            description,
            amount,
            type: transactionType,
            status: 'pending',
            paymentMethod: transactionType, // Usar o tipo processado também para paymentMethod, ou definir uma lógica específica se necessário
            tax: 0,
            source: 'import',
            reconciled: false,
            created_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Processar PDF (simplificado)
      else if (fileMimeTypeOrName.includes('pdf')) { // Verifica se o nome/tipo do arquivo indica PDF
        // Aqui você implementaria a lógica de processamento de PDF
        // Por enquanto, vamos apenas criar uma transação de exemplo
        transactions.push({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description: 'Transação PDF',
          amount: 100,
          type: 'credit',
          status: 'pending',
          paymentMethod: 'credit',
          tax: 0,
          source: 'import',
          reconciled: false,
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Processar OFX
      else if (fileMimeTypeOrName === 'application/octet-stream' || fileMimeTypeOrName.endsWith('.ofx')) { // Verifica pelo mimeType ou extensão .ofx
        // Aqui você implementaria a lógica de processamento de OFX
        // Por enquanto, vamos apenas criar uma transação de exemplo
        transactions.push({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          description: 'Transação OFX',
          amount: 100,
          type: 'debit',
          status: 'pending',
          paymentMethod: 'debit',
          tax: 0,
          source: 'import',
          reconciled: false,
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw error;
    }

    return transactions;
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Importar Extrato</Title>
          <Paragraph>Selecione o tipo de arquivo para importar:</Paragraph>

          <View style={styles.buttonGroup}>
            <Button
              mode="outlined"
              onPress={handleImportFile}
              disabled={loading}
              style={styles.button}
            >
              Importar Arquivo
            </Button>
          </View>

          {importingFile && (
            <View style={styles.importingInfo}>
              <Paragraph>Importando arquivo: {importingFile}</Paragraph>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  card: {
    flex: 1,
  },
  buttonGroup: {
    marginTop: 16,
  },
  button: {
    marginVertical: 8,
  },
  importingInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
});

export default ImportScreen;
