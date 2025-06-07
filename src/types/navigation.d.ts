import { NavigatorScreenParams } from '@react-navigation/native';

type RootStackParamList = {
  // Telas de autenticação
  Auth: undefined;
  
  // Telas principais (tabs)
  Tabs: NavigatorScreenParams<TabParamList>;
  
  // Outras telas do Stack
  Importar: undefined;
  Notificacoes: undefined;
  Relatorios: undefined;
  PaymentLinks: undefined;
};

type TabParamList = {
  Home: undefined;
  Pagamentos: undefined;
  Transacoes: undefined;
  Conciliacao: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
