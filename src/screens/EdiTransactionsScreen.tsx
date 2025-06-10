// src/screens/EdiTransactionsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { fetchEdiTransactions } from '../services/ediApi';

const arquivosTeste = [
  'CIELO03_1002022022_20241218_V151039123123999.txt',
  'CIELO04_1002022022_20241218_V151039123123999.txt',
];

export default function EdiTransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      setLoading(true);
      setError(null);
      fetchEdiTransactions(selectedFile)
        .then(setTransactions)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [selectedFile]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arquivos EDI de Teste</Text>
      <View style={styles.filesContainer}>
        {arquivosTeste.map((file) => (
          <TouchableOpacity
            key={file}
            style={selectedFile === file ? styles.selectedFileButton : styles.fileButton}
            onPress={() => setSelectedFile(file)}
          >
            <Text style={styles.fileButtonText}>{file}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {selectedFile && !loading && !error && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<Text style={styles.listHeader}>Transações do arquivo</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>ID: {item.id}</Text>
              <Text style={styles.itemText}>Data: {item.date}</Text>
              <Text style={styles.itemText}>Valor: R$ {item.amount / 100}</Text>
              <Text style={styles.itemText}>Líquido: R$ {item.net_amount / 100}</Text>
              <Text style={styles.itemText}>Bandeira: {item.card_brand}</Text>
              <Text style={styles.itemText}>Tipo: {item.transaction_type}</Text>
              <Text style={styles.itemText}>Parcelas: {item.installments}</Text>
              <Text style={styles.itemText}>NSU: {item.nsu}</Text>
              <Text style={styles.itemText}>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  filesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  fileButton: {
    backgroundColor: '#eee',
    borderRadius: 6,
    padding: 10,
    margin: 4,
  },
  selectedFileButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 10,
    margin: 4,
  },
  fileButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 12,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 4,
    elevation: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#222',
  },
});
