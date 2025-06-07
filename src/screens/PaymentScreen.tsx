import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/core';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = {
  navigate: (screen: keyof RootStackParamList) => void;
};

const PaymentScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const navigateToPaymentLinks = () => {
    navigation.navigate('PaymentLinks');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Gerenciar Pagamentos</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Links de Pagamento</Text>
        <Text style={styles.cardText}>Crie e gerencie links de pagamento personalizados para seus clientes.</Text>
        <Button
          mode="contained"
          onPress={navigateToPaymentLinks}
          style={styles.button}
          icon="link"
        >
          Gerenciar Links de Pagamento
        </Button>
      </View>
    </View>
  );
};

 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default PaymentScreen;
