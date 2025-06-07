import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { supabase } from '../lib/supabase';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Registro realizado', 'Verifique seu e-mail para confirmar o cadastro.');
      }
    } catch (error: unknown) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Ocorreu um erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>{isLogin ? 'Login' : 'Criar Conta'}</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={handleAuth} loading={loading} style={styles.button}>
        {isLogin ? 'Entrar' : 'Registrar'}
      </Button>
      <Button mode="text" onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Entre'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
  },
  switchButton: {
    marginTop: 8,
  },
});

export default AuthScreen;