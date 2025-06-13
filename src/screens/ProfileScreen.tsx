// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, ImageLibraryOptions, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  bio: string;
}

type ProfileScreenProps = StackScreenProps<RootStackParamList, 'ProfileScreen'>;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    avatar: null,
    bio: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Aqui você carregaria os dados do usuário do AsyncStorage ou API
      // Exemplo com dados mock:
      setUser({
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        avatar: null,
        bio: 'Desenvolvedor apaixonado por tecnologia'
      });
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Aqui você salvaria os dados no AsyncStorage ou enviaria para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações');
    } finally {
      setLoading(false);
    }
  };

  const selectImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 300,
      maxHeight: 300,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0] && response.assets[0].uri) {
        setUser(prev => ({
          ...prev,
          avatar: response.assets![0].uri! // Adicionando non-null assertion se temos certeza que existe
        }));
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Icon name={isEditing ? "close" : "edit"} size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={isEditing ? selectImage : undefined}
          >
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="person" size={50} color="#999" />
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraIcon}>
                <Icon name="camera-alt" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={user.name}
              onChangeText={(text) => setUser(prev => ({ ...prev, name: text }))}
              editable={isEditing}
              placeholder="Digite seu nome"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={user.email}
              onChangeText={(text) => setUser(prev => ({ ...prev, email: text }))}
              editable={isEditing}
              placeholder="Digite seu email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={user.phone}
              onChangeText={(text) => setUser(prev => ({ ...prev, phone: text }))}
              editable={isEditing}
              placeholder="Digite seu telefone"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.textArea, !isEditing && styles.inputDisabled]}
              value={user.bio}
              onChangeText={(text) => setUser(prev => ({ ...prev, bio: text }))}
              editable={isEditing}
              placeholder="Conte um pouco sobre você"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Profile Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f8f8f8',
    color: '#666',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default ProfileScreen;