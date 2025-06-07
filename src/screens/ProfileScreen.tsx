import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { User } from '../types/index';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notificationChannels, setNotificationChannels] = useState<string[]>([]);
  const [minNotificationValue, setMinNotificationValue] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (userError) throw userError;

        // Garantir que o objeto user tenha a estrutura correta
        const userWithPreferences: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'user', // Valor padrão para role
          preferences: {
            notificationChannels: userData.preferences?.notificationChannels || [],
            minNotificationValue: userData.preferences?.minNotificationValue || 0
          }
        };
        
        setUser(userWithPreferences);
        setEmail(userData.email);
        setName(userData.name);
        setNotificationChannels(userWithPreferences.preferences.notificationChannels);
        setMinNotificationValue(userWithPreferences.preferences.minNotificationValue.toString());
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const updatedPreferences = {
        notificationChannels,
        minNotificationValue: parseFloat(minNotificationValue) || 0,
      };

      const { error } = await supabase
        .from('users')
        .update({
          name,
          preferences: updatedPreferences,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar cache local
      setUser({
        ...user,
        name,
        preferences: updatedPreferences,
      });
      
      // Atualizar os estados locais
      setNotificationChannels(notificationChannels);
      setMinNotificationValue(updatedPreferences.minNotificationValue.toString());
      
      // Feedback para o usuário
      alert('Perfil atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
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
      <Card style={styles.card}>
        <Card.Content>
          <Title>Informações Pessoais</Title>
          <TextInput
            label="Nome"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            editable={false}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Preferências de Notificação</Title>
          <TextInput
            label="Canais de Notificação"
            value={notificationChannels.join(', ')}
            onChangeText={(text) => setNotificationChannels(text.split(','))}
            style={styles.input}
          />
          <TextInput
            label="Valor Mínimo para Notificação"
            value={minNotificationValue}
            onChangeText={setMinNotificationValue}
            keyboardType="numeric"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          style={styles.updateButton}
        >
          Salvar Alterações
        </Button>
      </View>
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
  card: {
    margin: 16,
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    margin: 16,
  },
  updateButton: {
    marginTop: 16,
  },
});

export default ProfileScreen;
