// src/services/integrations/acquirerService.ts
import { supabase } from '../../lib/supabase';
import * as SecureStore from 'expo-secure-store';

// Tipos
export type OperatorCredentials = {
  username: string;
  password: string;
  merchantId?: string;
  apiKey?: string;
};

export type OperatorSettings = {
  enabled: boolean;
  credentials?: OperatorCredentials;
  lastSync?: string;
};

export type UserOperatorSettings = {
  cielo?: OperatorSettings;
  stone?: OperatorSettings;
  rede?: OperatorSettings;
};

// Chaves para armazenamento seguro
const OPERATOR_SETTINGS_KEY = 'user_operator_settings';

// Serviço de integração com adquirentes
export const acquirerService = {
  // Obter configurações de todas as operadoras para o usuário
  async getUserOperatorSettings(): Promise<UserOperatorSettings> {
    try {
      // Tentar buscar do armazenamento seguro primeiro
      const storedSettings = await SecureStore.getItemAsync(OPERATOR_SETTINGS_KEY);
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
      
      // Se não encontrar, buscar do Supabase
      const { data, error } = await supabase
        .from('user_operator_settings')
        .select('operator, settings');
      
      if (error) throw error;
      
      // Transformar array em objeto
      const settings: UserOperatorSettings = {};
      if (data) {
        data.forEach(item => {
          settings[item.operator] = {
            enabled: true,
            ...item.settings,
            // Não incluir credenciais sensíveis aqui
            credentials: undefined
          };
        });
      }
      
      // Armazenar localmente (sem credenciais sensíveis)
      await SecureStore.setItemAsync(OPERATOR_SETTINGS_KEY, JSON.stringify(settings));
      
      return settings;
    } catch (error) {
      console.error('Error fetching operator settings:', error);
      return {};
    }
  },
  
  // Salvar configurações de uma operadora
  async saveOperatorSettings(
    operator: string, 
    settings: OperatorSettings
  ): Promise<boolean> {
    try {
      // Extrair credenciais para armazenamento seguro separado
      const { credentials, ...publicSettings } = settings;
      
      // Salvar no Supabase (sem credenciais sensíveis)
      const { error } = await supabase
        .from('user_operator_settings')
        .upsert({
          operator,
          settings: publicSettings
        });
      
      if (error) throw error;
      
      // Salvar credenciais localmente de forma segura
      if (credentials) {
        await SecureStore.setItemAsync(
          `operator_${operator}_credentials`,
          JSON.stringify(credentials)
        );
      }
      
      // Atualizar cache local
      const currentSettings = await this.getUserOperatorSettings();
      currentSettings[operator] = {
        ...publicSettings,
        credentials: undefined // Não incluir no cache geral
      };
      await SecureStore.setItemAsync(
        OPERATOR_SETTINGS_KEY, 
        JSON.stringify(currentSettings)
      );
      
      return true;
    } catch (error) {
      console.error(`Error saving ${operator} settings:`, error);
      return false;
    }
  },
  
  // Obter credenciais de uma operadora específica
  async getOperatorCredentials(operator: string): Promise<OperatorCredentials | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync(`operator_${operator}_credentials`);
      return credentialsJson ? JSON.parse(credentialsJson) : null;
    } catch (error) {
      console.error(`Error getting ${operator} credentials:`, error);
      return null;
    }
  },
  
  // Buscar arquivos de conciliação
  async getConciliationFiles(limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('conciliation_files')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return { 
        files: data || [], 
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };
    } catch (error) {
      console.error('Error fetching conciliation files:', error);
      throw error;
    }
  },
  
  // Buscar transações de um arquivo específico
  async getFileTransactions(fileId: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('conciliation_file_id', fileId)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching file transactions:', error);
      throw error;
    }
  },
  
  // Solicitar sincronização manual de uma operadora
  async requestManualSync(operator: string): Promise<boolean> {
    try {
      // Esta função poderia chamar uma API do seu backend
      // para iniciar uma sincronização manual
      
      // Por enquanto, apenas simular uma atualização de status
      const { error } = await supabase
        .from('user_operator_settings')
        .update({
          settings: {
            lastSyncRequested: new Date().toISOString()
          }
        })
        .eq('operator', operator);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error requesting manual sync for ${operator}:`, error);
      return false;
    }
  }
};