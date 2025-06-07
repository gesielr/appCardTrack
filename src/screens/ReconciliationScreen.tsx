import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { Reconciliation, Transaction } from '../types';
// Usando uma abordagem direta sem o hook useNavigation
import { supabase } from '../lib/supabase';

interface ReconciliationItemProps {
  reconciliation: Reconciliation;
  onRefresh: () => void;
}

const ReconciliationItem: React.FC<ReconciliationItemProps> = ({
  reconciliation,
  onRefresh,
}) => {
  const handleResolve = async () => {
    try {
      const { error } = await supabase
        .from('reconciliations')
        .update({ status: 'matched', resolvedAt: new Date().toISOString() })
        .eq('id', reconciliation.id);

      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Erro ao resolver conciliação:', error);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{reconciliation.transactionId ? `Transação ID: ${reconciliation.transactionId}` : 'ID da Transação Não Disponível'}</Title>
        <Paragraph style={styles.status}>
          {reconciliation.status === 'matched' ? 'Conciliado' : 'Pendente'}
        </Paragraph>
        <Paragraph style={styles.difference}>
          Diferença: R$ {typeof reconciliation.difference === 'number' ? reconciliation.difference.toFixed(2) : 'N/A'}
        </Paragraph>
        {reconciliation.reason && (
          <Paragraph style={styles.reason}>{reconciliation.reason}</Paragraph>
        )}
        {reconciliation.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleResolve}
            style={styles.resolveButton}
          >
            Resolver
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const ReconciliationScreen = () => {
  // @ts-ignore
  const navigation = window.navigation || { navigate: () => {} };
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReconciliations = async () => {
    try {
      const { data, error } = await supabase
        .from('reconciliations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReconciliations(data);
    } catch (error) {
      console.error('Erro ao buscar conciliações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReconciliations();
  };

  return (
    <View style={styles.container}>
      {/* Card de Importação de Extratos */}
      <Card style={styles.actionCard}>
        <TouchableOpacity 
          onPress={() => {
            // @ts-ignore
            const nav = navigation.navigate || (() => {});
            nav('Tabs', { screen: 'Conciliacao' });
          }}
          style={styles.touchableCardContent}
        >
          <IconButton icon="file-upload-outline" size={30} iconColor="#0A4F6A" />
          <Title style={styles.actionCardTitle}>Importar Extratos</Title>
        </TouchableOpacity>
      </Card>

      {/* Lista de Conciliações */}
      {loading ? (
        <ActivityIndicator animating={true} />
      ) : reconciliations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Paragraph style={styles.emptyText}>Nenhuma conciliação pendente</Paragraph>
        </View>
      ) : (
        <FlatList
          data={reconciliations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReconciliationItem reconciliation={item} onRefresh={fetchReconciliations} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

// Estilos devem ser declarados fora do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  actionCard: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
  },
  touchableCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionCardTitle: {
    marginLeft: 8,
    color: '#0A4F6A',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  difference: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  reason: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  resolveButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ReconciliationScreen;
