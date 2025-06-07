import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator, List } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { Transaction, Reconciliation } from '../../types';

interface WhatsAppIntegrationProps {
  navigation: any;
}

interface WhatsAppMessage {
  id: string;
  type: 'transaction' | 'reconciliation' | 'alert';
  content: string;
  sent: boolean;
  created_at: string;
  data: Transaction | Reconciliation;
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);

  useEffect(() => {
    fetchMessages();

    // Criar listener para novas mensagens
    const messageListener = supabase
      .channel('whatsapp_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_messages',
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      messageListener.unsubscribe();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: WhatsAppMessage) => {
    try {
      // Aqui você implementaria a lógica de envio real para o WhatsApp
      // Por enquanto, vamos simular o envio
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ sent: true })
        .eq('id', message.id);

      if (error) throw error;
      
      // Simular o envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Sucesso!', 'Mensagem enviada com sucesso!');
      fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    }
  };

  const openWhatsApp = async (message: WhatsAppMessage) => {
    try {
      let phoneNumber = null;
      // Verifica se 'customerPhone' existe no objeto e se o objeto é uma Transação
      if ('customerPhone' in message.data && typeof message.data.customerPhone === 'string' && message.data.customerPhone) {
        phoneNumber = message.data.customerPhone;
      }

      if (phoneNumber) {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message.content)}`;
        await Linking.openURL(url);
      } else {
        Alert.alert('Atenção', 'Número de telefone não disponível para esta entrada.');
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    }
  };

  const renderMessage = (message: WhatsAppMessage) => (
    <Card key={message.id} style={styles.messageCard}>
      <Card.Content>
        <Title>{getMessageTitle(message)}</Title>
        <Paragraph>{message.content}</Paragraph>
        <List.Item
          title="Enviar para WhatsApp"
          left={props => <List.Icon {...props} icon="whatsapp" />}
          onPress={() => openWhatsApp(message)}
        />
        <Button
          mode="contained"
          onPress={() => sendMessage(message)}
          disabled={message.sent}
        >
          {message.sent ? 'Enviado' : 'Enviar'}
        </Button>
      </Card.Content>
    </Card>
  );

  const getMessageTitle = (message: WhatsAppMessage) => {
    switch (message.type) {
      case 'transaction':
        return 'Nova Transação';
      case 'reconciliation':
        return 'Conciliação Pendente';
      case 'alert':
        return 'Alerta Importante';
      default:
        return 'Mensagem WhatsApp';
    }
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
      {messages.map((message) => renderMessage(message))}
    </ScrollView>
  );
};

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
  messageCard: {
    marginBottom: 16,
  },
});

export default WhatsAppIntegration;
