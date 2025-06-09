// src/screens/OperatorSettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Switch, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  acquirerService, 
  OperatorSettings, 
  UserOperatorSettings 
} from '../services/integrations/acquirerService';

export default function OperatorSettingsScreen() {
  const [settings, setSettings] = useState<UserOperatorSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Formulários para cada operadora
  const [cieloForm, setCieloForm] = useState({
    enabled: false,
    username: '',
    password: '',
    merchantId: ''
  });
  
  const [stoneForm, setStoneForm] = useState({
    enabled: false,
    username: '',
    password: '',
    stoneCode: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const userSettings = await acquirerService.getUserOperatorSettings();
      setSettings(userSettings);
      
      // Carregar credenciais de cada operadora
      if (userSettings.cielo?.enabled) {
        const cieloCredentials = await acquirerService.getOperatorCredentials('cielo');
        setCieloForm({
          enabled: true,
          username: cieloCredentials?.username || '',
          password: cieloCredentials?.password || '',
          merchantId: cieloCredentials?.merchantId || ''
        });
      }
      
      if (userSettings.stone?.enabled) {
        const stoneCredentials = await acquirerService.getOperatorCredentials('stone');
        setStoneForm({
          enabled: true,
          username: stoneCredentials?.username || '',
          password: stoneCredentials?.password || '',
          stoneCode: stoneCredentials?.merchantId || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações');
    } finally {
      setLoading(false);
    }
  }

  async function saveCieloSettings() {
    try {
      setSaving(true);
      
      const operatorSettings: OperatorSettings = {
        enabled: cieloForm.enabled,
        credentials: {
          username: cieloForm.username,
          password: cieloForm.password,
          merchantId: cieloForm.merchantId
        },
        lastSync: settings.cielo?.lastSync
      };
      
      const success = await acquirerService.saveOperatorSettings('cielo', operatorSettings);
      
      if (success) {
        Alert.alert('Sucesso', 'Configurações da Cielo salvas com sucesso');
      } else {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving Cielo settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações da Cielo');
    } finally {
      setSaving(false);
    }
  }

  async function saveStoneSettings() {
    try {
      setSaving(true);
      
      const operatorSettings: OperatorSettings = {
        enabled: stoneForm.enabled,
        credentials: {
          username: stoneForm.username,
          password: stoneForm.password,
          merchantId: stoneForm.stoneCode
        },
        lastSync: settings.stone?.lastSync
      };
      
      const success = await acquirerService.saveOperatorSettings('stone', operatorSettings);
      
      if (success) {
        Alert.alert('Sucesso', 'Configurações da Stone salvas com sucesso');
      } else {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving Stone settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações da Stone');
    } finally {
      setSaving(false);
    }
  }

  async function requestManualSync(operator: string) {
    try {
      const success = await acquirerService.requestManualSync(operator);
      
      if (success) {
        Alert.alert('Sincronização Solicitada', 
          `A sincronização manual da ${operator} foi solicitada. Isso pode levar alguns minutos.`);
      } else {
        throw new Error('Falha ao solicitar sincronização');
      }
    } catch (error) {
      console.error(`Error requesting sync for ${operator}:`, error);
      Alert.alert('Erro', `Não foi possível solicitar a sincronização da ${operator}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configurações de Operadoras</Text>
      
      {/* Cielo Settings */}
      <View style={styles.operatorCard}>
        <View style={styles.operatorHeader}>
          <Text style={styles.operatorTitle}>Cielo</Text>
          <Switch
            value={cieloForm.enabled}
            onValueChange={(value) => setCieloForm({...cieloForm, enabled: value})}
          />
        </View>
        
        {cieloForm.enabled && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Usuário SFTP</Text>
            <TextInput
              style={styles.input}
              value={cieloForm.username}
              onChangeText={(text) => setCieloForm({...cieloForm, username: text})}
              placeholder="Usuário SFTP da Cielo"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Senha SFTP</Text>
            <TextInput
              style={styles.input}
              value={cieloForm.password}
              onChangeText={(text) => setCieloForm({...cieloForm, password: text})}
              placeholder="Senha SFTP da Cielo"
              secureTextEntry
            />
            
            <Text style={styles.label}>Código do Estabelecimento (EC)</Text>
            <TextInput
              style={styles.input}
              value={cieloForm.merchantId}
              onChangeText={(text) => setCieloForm({...cieloForm, merchantId: text})}
              placeholder="Código EC da Cielo"
              keyboardType="numeric"
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCieloSettings}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.syncButton}
                onPress={() => requestManualSync('cielo')}
                disabled={!cieloForm.enabled || saving}
              >
                <Text style={styles.buttonText}>Sincronizar Agora</Text>
              </TouchableOpacity>
            </View>
            
            {settings.cielo?.lastSync && (
              <Text style={styles.syncInfo}>
                Última sincronização: {new Date(settings.cielo.lastSync).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Stone Settings */}
      <View style={styles.operatorCard}>
        <View style={styles.operatorHeader}>
          <Text style={styles.operatorTitle}>Stone</Text>
          <Switch
            value={stoneForm.enabled}
            onValueChange={(value) => setStoneForm({...stoneForm, enabled: value})}
          />
        </View>
        
        {stoneForm.enabled && (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Usuário SFTP</Text>
            <TextInput
              style={styles.input}
              value={stoneForm.username}
              onChangeText={(text) => setStoneForm({...stoneForm, username: text})}
              placeholder="Usuário SFTP da Stone"
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Senha SFTP</Text>
            <TextInput
              style={styles.input}
              value={stoneForm.password}
              onChangeText={(text) => setStoneForm({...stoneForm, password: text})}
              placeholder="Senha SFTP da Stone"
              secureTextEntry
            />
            
            <Text style={styles.label}>Código Stone</Text>
            <TextInput
              style={styles.input}
              value={stoneForm.stoneCode}
              onChangeText={(text) => setStoneForm({...stoneForm, stoneCode: text})}
              placeholder="Código Stone"
              keyboardType="numeric"
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveStoneSettings}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.syncButton}
                onPress={() => requestManualSync('stone')}
                disabled={!stoneForm.enabled || saving}
              >
                <Text style={styles.buttonText}>Sincronizar Agora</Text>
              </TouchableOpacity>
            </View>
            
            {settings.stone?.lastSync && (
              <Text style={styles.syncInfo}>
                Última sincronização: {new Date(settings.stone.lastSync).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </View>
      
      <Text style={styles.infoText}>
        Configure as credenciais SFTP fornecidas pelas operadoras para habilitar a conciliação automática de transações.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  operatorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  operatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555555',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  syncInfo: {
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
});