import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../../lib/supabase';
import { Transaction, Reconciliation } from '../../types';

interface NotificationScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  type: 'transaction' | 'reconciliation' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data: Transaction | Reconciliation;
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Criar listener para novas notificações
    const notificationListener = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      notificationListener.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const renderNotification = (notification: Notification) => {
    const getBackgroundColor = () => {
      switch (notification.type) {
        case 'transaction':
          return '#E8F5E9';
        case 'reconciliation':
          return '#FFF3E0';
        case 'error':
          return '#FFECEC';
        default:
          return '#fff';
      }
    };

    return (
      <Card
        style={[styles.notificationCard, { backgroundColor: getBackgroundColor() }]}
        onPress={() => markAsRead(notification.id)}
      >
        <Card.Content>
          <View style={styles.notificationHeader}>
            <Title>{notification.title}</Title>
            <Paragraph style={styles.notificationDate}>
              {new Date(notification.created_at).toLocaleDateString()}
            </Paragraph>
          </View>
          <Paragraph style={styles.notificationMessage}>
            {notification.message}
          </Paragraph>
          {notification.data && (
            <View style={styles.notificationDetails}>
              {Object.entries(notification.data).map(([key, value]) => (
                <View key={key} style={styles.detailItem}>
                  <Paragraph style={styles.detailLabel}>{key}:</Paragraph>
                  <Paragraph style={styles.detailValue}>{value}</Paragraph>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {notifications.map((notification) => (
        <View key={notification.id}>
          {renderNotification(notification)}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationDate: {
    color: '#666',
  },
  notificationMessage: {
    marginBottom: 8,
  },
  notificationDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
  },
});

export default NotificationScreen;
