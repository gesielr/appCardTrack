import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Share, Alert, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { PaymentLink } from '../types';
import { Product } from '../types/index';
import { supabase } from '../lib/supabase';

interface ProductInputProps {
  product: Product;
  onRemove: (id: string) => void;
}

const ProductInput: React.FC<ProductInputProps> = ({ product, onRemove }) => {
  return (
    <Card style={styles.productCard}>
      <Card.Content>
        <Title>{product.name}</Title>
        <Paragraph>{product.description}</Paragraph>
        <Paragraph style={styles.price}>R$ {product.price.toFixed(2)}</Paragraph>
        <Button
          mode="text"
          onPress={() => onRemove(product.id)}
          style={styles.removeButton}
        >
          Remover
        </Button>
      </Card.Content>
    </Card>
  );
};

const PaymentLinksScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const addProduct = () => {
    if (!newProductName || !newProductDescription || !newProductPrice) return;

    const product: Product = {
      id: Date.now().toString(),
      name: newProductName,
      description: newProductDescription,
      price: parseFloat(newProductPrice),
      category: 'custom',
    };

    setProducts([...products, product]);
    setNewProductName('');
    setNewProductDescription('');
    setNewProductPrice('');
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const sharePaymentLink = async (link: string, products: Product[]) => {
    try {
      const productList = products.map(p => `- ${p.name}: R$ ${p.price.toFixed(2)}`).join('\n');
      const total = products.reduce((sum, p) => sum + p.price, 0);
      
      const message = `💳 *Link de Pagamento*\n\n` +
        `Você recebeu um link de pagamento para:\n${productList}\n\n` +
        `*Total: R$ ${total.toFixed(2)}*\n\n` +
        `Clique no link para efetuar o pagamento:\n${link}`;
      
      const result = await Share.share({
        message: Platform.OS === 'android' ? message : `Link de Pagamento: ${link}`,
        url: link,
        title: 'Link de Pagamento',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Compartilhado com sucesso
          console.log('Compartilhado com', result.activityType);
        } else {
          // Compartilhado com sucesso (não especificado como)
          console.log('Compartilhado com sucesso');
        }
      } else if (result.action === Share.dismissedAction) {
        // Usuário cancelou o compartilhamento
        console.log('Compartilhamento cancelado');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      alert('Ocorreu um erro ao tentar compartilhar o link.');
    }
  };

  const handleOpenLink = () => {
    if (generatedLink) {
      Linking.openURL(generatedLink);
    }
  };

  const generatePaymentLink = async () => {
    if (products.length === 0) return;

    setLoading(true);
    
    try {
      console.log('Iniciando geração de link de pagamento...');
      
      // Verifica a conexão com o Supabase
      console.log('Verificando conexão com o Supabase...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError || !authData.session) {
        console.error('Erro de autenticação com o Supabase:', authError);
        throw new Error('Não foi possível autenticar com o servidor. Por favor, faça login novamente.');
      }
      
      console.log('Usuário autenticado:', authData.session.user.email);

      // Prepara os dados do link de pagamento
      const paymentLinkData = {
        user_id: authData.session.user.id,
        products: products.map(p => ({
          name: p.name,
          description: p.description,
          price: p.price,
          quantity: 1
        })),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expira em 24h
        status: 'pending',
        total_amount: products.reduce((sum, p) => sum + p.price, 0),
        created_at: new Date().toISOString()
      };

      console.log('Dados do link de pagamento:', JSON.stringify(paymentLinkData, null, 2));

      // Tenta listar as tabelas disponíveis (para debug)
      try {
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        if (!tablesError) {
          console.log('Tabelas disponíveis no banco de dados:', tables);
        }
      } catch (tablesError) {
        console.warn('Não foi possível listar as tabelas:', tablesError);
      }

      // Tenta inserir os dados diretamente sem verificar a tabela primeiro
      console.log('Tentando inserir dados na tabela payment_links...');
      const { data, error } = await supabase
        .from('payment_links')
        .insert([paymentLinkData]) // Envolve em array para garantir o formato correto
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Verifica se o erro é relacionado à tabela não existente
        if (error.code === '42P01') { // Código para tabela não encontrada
          throw new Error('A tabela de links de pagamento não foi encontrada no banco de dados.');
        }
        
        throw new Error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      }

      // Se chegou aqui, o link foi gerado com sucesso
      console.log('Link gerado com sucesso:', data);
      
      // Gera um link amigável para compartilhamento
      const baseUrl = 'https://seu-dominio.com/pay';
      const paymentLink = `${baseUrl}?id=${data.id}`;
      
      setGeneratedLink(paymentLink);
      
      // Mostra o link gerado e opções de compartilhamento
      Alert.alert(
        'Link de Pagamento Gerado!',
        'Seu link de pagamento foi criado com sucesso. Deseja compartilhá-lo agora?',
        [
          {
            text: 'Copiar Link',
            onPress: () => {
              // @ts-ignore - navigator.clipboard.writeText não está tipado corretamente
              navigator.clipboard.writeText(paymentLink);
              alert('Link copiado para a área de transferência!');
            },
          },
          {
            text: 'Compartilhar',
            onPress: () => sharePaymentLink(paymentLink, products),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      
      // Limpa a lista de produtos após gerar o link
      setProducts([]);
      
    } catch (error: any) {
      console.error('Erro completo ao gerar link de pagamento:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      // Mensagem mais amigável para o usuário
      const errorMessage = error?.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.';
      alert(`❌ ${errorMessage}`);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Title style={styles.title}>Gerar Link de Pagamento</Title>
        
        {generatedLink && (
          <Card style={[styles.linkCard, styles.shadow]}>
            <Card.Content>
              <Title>Seu Link de Pagamento</Title>
              <Paragraph style={styles.linkText} numberOfLines={2}>
                {generatedLink}
              </Paragraph>
              <View style={styles.linkActions}>
                <Button 
                  mode="contained" 
                  onPress={() => sharePaymentLink(generatedLink, products)}
                  style={styles.actionButton}
                  icon="share-variant"
                >
                  Compartilhar
                </Button>
                <Button 
                  mode="outlined"
                  onPress={() => {
                    // @ts-ignore
                    navigator.clipboard.writeText(generatedLink);
                    alert('Link copiado para a área de transferência!');
                  }}
                  style={styles.actionButton}
                  icon="content-copy"
                >
                  Copiar
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        
        <View style={styles.formContainer}>
          <TextInput
            label="Nome do Produto"
            value={newProductName}
            onChangeText={setNewProductName}
            style={styles.input}
          />
          <TextInput
            label="Descrição"
            value={newProductDescription}
            onChangeText={setNewProductDescription}
            style={styles.input}
          />
          <TextInput
            label="Preço"
            value={newProductPrice}
            onChangeText={setNewProductPrice}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={addProduct}
            style={styles.addButton}
          >
            Adicionar Produto
          </Button>
        </View>

        <View style={styles.productsList}>
          {products.map((product) => (
            <ProductInput
              key={product.id}
              product={product}
              onRemove={removeProduct}
            />
          ))}
        </View>

       
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 20,
    paddingBottom: 40,
  },
  linkCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  linkText: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
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
  input: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    marginBottom: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  removeButton: {
    marginTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    marginTop: 10,
  },
  generateButtonContainer: {
    padding: 16,
  },
  addButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
  generateButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6200ee',
  },
});

export default PaymentLinksScreen;
