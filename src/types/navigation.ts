import type { NavigatorScreenParams, RouteProp } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Telas de autenticação
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Telas principais
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  
  // Outras telas
  PaymentLinks: undefined;
  PaymentScreen: undefined;
  Reconciliation: undefined;
  Profile: undefined;
  
  // Adicione outras telas conforme necessário
};

export type MainTabParamList = {
  Home: undefined;
  Payments: undefined;
  Reconciliation: undefined;
  Profile: undefined;
};

// Tipos de navegação para cada tela
export type PaymentScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaymentScreen'
>;

export type PaymentLinksScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaymentLinks'
>;

// Tipos para o hook useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Exportar os tipos para uso em outros arquivos
export type { NativeStackNavigationProp } from '@react-navigation/native-stack';
export type { RouteProp } from '@react-navigation/core';
