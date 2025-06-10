import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/core'; // Reverted to @react-navigation/core
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../lib/supabase';
import { RootStackParamList, TabParamList } from '../types'; // Importando tipos globais

// Screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import PaymentScreen from '../screens/PaymentScreen'; // Nova tela de Pagamentos
import TransactionsScreen from '../screens/TransactionsScreen'; // Nova tela de Transações
import ReconciliationScreen from '../screens/ReconciliationScreen'; // Nova tela de Conciliação
import PaymentLinksScreen from '../screens/PaymentLinksScreen'; // Tela de Links de Pagamento
import EdiTransactionsScreen from '../screens/EdiTransactionsScreen'; // Tela de Teste EDI

// Telas do Stack acessadas pelo Dashboard
import ImportScreen from '../components/Import/ImportScreen';
import NotificationScreen from '../components/Notifications/NotificationScreen';
import ReportsScreen from '../components/Reports/ReportsScreen';
// import WhatsAppIntegration from '../components/WhatsApp/WhatsAppIntegration'; // Comentado se não for usado agora

const Tab = createBottomTabNavigator(); // <TabParamList> removido temporariamente para diagnóstico
const RootStack = createStackNavigator(); // <RootStackParamList> removido temporariamente para diagnóstico

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
  },
});

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<TabParamList, keyof TabParamList> }) => ({
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline'; // Ícone padrão

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Pagamentos') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Transacoes') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Conciliacao') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Pagamentos" component={PaymentScreen} options={{ title: 'Pagamentos' }} />
      <Tab.Screen name="Transacoes" component={TransactionsScreen} options={{ title: 'Transações' }} />
      <Tab.Screen name="Conciliacao" component={ReconciliationScreen} options={{ title: 'Conciliação' }} />
      <Tab.Screen name="EdiTeste" component={EdiTransactionsScreen} options={{ title: 'EDI Teste' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        console.log('AppNavigator User (onAuthStateChange):', user);
        setIsAuthenticated(!!user);
        console.log('AppNavigator isAuthenticated (onAuthStateChange):', !!user);
      }
    );

    // Verifica o usuário inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!authListener) { // Apenas se o listener não tiver atualizado ainda
        console.log('AppNavigator User (initial check):', user);
        setIsAuthenticated(!!user);
        console.log('AppNavigator isAuthenticated (initial check):', !!user);
      }
    }).catch(error => {
      console.error('AppNavigator Auth Error (initial check):', error);
      setIsAuthenticated(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <RootStack.Navigator>
      {isAuthenticated ? (
        <>
          <RootStack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen name="Importar" component={ImportScreen} />
          <RootStack.Screen name="Notificacoes" component={NotificationScreen} />
          <RootStack.Screen name="Relatorios" component={ReportsScreen} />
          <RootStack.Screen 
            name="PaymentLinks" 
            component={PaymentLinksScreen} 
            options={{ title: 'Links de Pagamento' }} 
          />
          {/* Adicione outras telas do Stack principal aqui, se necessário */}
        </>
      ) : (
        <RootStack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      )}
    </RootStack.Navigator>
  );
};

export default AppNavigator;