import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { RootStackParamList, TabParamList } from '../types';

// Screens
import AuthScreen from '../screens/AuthScreen';
import EDIImportScreen from '../screens/EDIImportScreen';
import HomeScreen from '../screens/HomeScreen';
import PaymentScreen from '../screens/PaymentScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReconciliationScreen from '../screens/ReconciliationScreen';
import PaymentLinksScreen from '../screens/PaymentLinksScreen';
import EdiTransactionsScreen from '../screens/EdiTransactionsScreen';
import SalesReportScreen from '../screens/SalesReportScreen';
import BankReconciliationScreen from '../screens/BankReconciliationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OperatorSettingsScreen from '../screens/OperatorSettingsScreen';


// Stack screens
import ImportScreen from '../components/Import/ImportScreen';
import NotificationScreen from '../components/Notifications/NotificationScreen';
import ReportsScreen from '../components/Reports/ReportsScreen';


const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
  },
});

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Pagamentos':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Transacoes':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Conciliacao':
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
              break;
            case 'EdiTeste':
              iconName = focused ? 'code-slash' : 'code-slash-outline';
              break;
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

const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Verificação inicial do usuário
    const checkInitialAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('AppNavigator User (initial check):', user);
        setIsAuthenticated(!!user);
        console.log('AppNavigator isAuthenticated (initial check):', !!user);
      } catch (error) {
        console.error('AppNavigator Auth Error (initial check):', error);
        setIsAuthenticated(false);
      }
    };

    checkInitialAuth();

    // Listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        console.log('AppNavigator User (onAuthStateChange):', user);
        setIsAuthenticated(!!user);
        console.log('AppNavigator isAuthenticated (onAuthStateChange):', !!user);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <RootStack.Navigator>
      {isAuthenticated ? (
        <React.Fragment>
          <RootStack.Screen
            name="Tabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen 
            name="Importar" 
            component={ImportScreen}
            options={{ title: 'Importar Dados' }}
          />
          <RootStack.Screen 
            name="Notificacoes" 
            component={NotificationScreen}
            options={{ title: 'Notificações' }}
          />
          <RootStack.Screen 
            name="Relatorios" 
            component={ReportsScreen}
            options={{ title: 'Relatórios' }}
          />
          <RootStack.Screen 
            name="EDIImport" 
            component={EDIImportScreen}
            options={{ title: 'Importar EDI' }}
          />
          <RootStack.Screen 
            name="PaymentLinks" 
            component={PaymentLinksScreen} 
            options={{ title: 'Links de Pagamento' }} 
          />
          <RootStack.Screen 
            name="ProfileScreen" 
            component={ProfileScreen}
            options={{ title: 'Perfil' }}
          />
          <RootStack.Screen 
            name="OperatorSettingsScreen" 
            component={OperatorSettingsScreen}
            options={{ title: 'Configurações do Operador' }}
          />
          <RootStack.Screen 
            name="SalesReport" 
            component={SalesReportScreen}
            options={{ title: 'Relatório de Vendas' }}
          />
          <RootStack.Screen 
            name="BankReconciliation" 
            component={BankReconciliationScreen}
            options={{ title: 'Conciliação Bancária' }}
          />
        </React.Fragment>
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