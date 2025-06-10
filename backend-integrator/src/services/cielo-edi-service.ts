// backend-integrator/src/services/cielo-edi-service.ts
// Define a type for SFTP files (local only)
type SFTPFile = { name: string; [key: string]: any };

import { SFTPClient } from '../utils/sftp-client';
import { supabase } from '../utils/supabase-client';
import { parseCieloEDIFile } from './edi-parser';
import { NormalizedTransaction } from '../models/transaction';
import { FileMetadata } from '../models/file-metadata';
import * as config from 'config';
import logger from '../utils/logger';

export class CieloEdiService {
  private client: SFTPClient;
  private config: {
    host: string;
    port: number;
    username: string;
    password: string;
    remotePath: string;
  };

  constructor(userId?: string) {
    this.client = new SFTPClient();
    
    // Se userId for fornecido, buscar credenciais específicas do usuário
    if (userId) {
      // Implementar lógica para buscar credenciais do usuário
      // Por enquanto, usar configuração global
    }
    
    this.config = {
      host: config.get('cielo.sftp.host'),
      port: config.get('cielo.sftp.port'),
      username: config.get('cielo.sftp.username'),
      password: config.get('cielo.sftp.password'),
      remotePath: config.get('cielo.sftp.remotePath'),
    };
  }

  async connect() {
    try {
      await this.client.connect(this.config);
      logger.info('Connected to Cielo SFTP');
      return true;
    } catch (error) {
      logger.error('Failed to connect to Cielo SFTP:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      logger.info('Disconnected from Cielo SFTP');
    } catch (error) {
      logger.error('Failed to disconnect from Cielo SFTP:', error);
    }
  }

  public async fetchFiles(userId: string): Promise<void> {
    try {
      if (!await this.connect()) {
        throw new Error('Failed to connect to SFTP server');
      }
      
      // Listar arquivos no diretório remoto
      const files: SFTPFile[] = await this.client.list(this.config.remotePath);
      logger.info(`Found ${files.length} files on Cielo SFTP`);
      
      // Filtrar apenas arquivos EDI não processados
      const ediFiles = files.filter(file => 
        file.name.endsWith('.txt') || file.name.endsWith('.ret')
      );
      
      // Verificar quais arquivos já foram processados
      for (const file of ediFiles) {
        const { data } = await supabase
          .from('conciliation_files')
          .select('id')
          .eq('file_name', file.name)
          .eq('user_id', userId)
          .eq('operator', 'cielo')
          .single();
        
        // Se o arquivo já foi processado, pular
        if (data) {
          logger.info(`File ${file.name} already processed, skipping`);
          continue;
        }
        
        // Baixar e processar o arquivo
        logger.info(`Downloading file ${file.name}`);
        const fileContent = await this.client.get(`${this.config.remotePath}/${file.name}`);
        
        // Processar o arquivo
        await this.processFile(fileContent.toString(), file.name, userId);
        
        logger.info(`Successfully processed file ${file.name}`);
      }
      
      await this.client.disconnect();
    } catch (error) {
      logger.error('Error fetching Cielo files:', error);
    }
  }

  async processFile(fileContent: string, fileName: string, userId: string) {
    let fileRecord: any = undefined;
    try {
      // Registrar arquivo na tabela conciliation_files
      const { data, error: fileError } = await supabase
        .from('conciliation_files')
        .insert({
          file_name: fileName,
          user_id: userId,
          operator: 'cielo',
          status: 'processing',
        })
        .select()
        .single();
      fileRecord = data;

      if (fileError) throw fileError;

      // Parsear o arquivo
      const transactions: NormalizedTransaction[] = parseCieloEDIFile(fileContent, fileName);

      // Inserir transações no banco
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(
          transactions.map(t => ({
            ...t,
            user_id: userId,
            conciliation_file_id: fileRecord.id,
            operator_source: 'cielo'
          }))
        );

      if (transactionError) throw transactionError;

      // Atualizar status do arquivo
      await supabase
        .from('conciliation_files')
        .update({ 
          status: 'completed', 
          processed_at: new Date().toISOString(),
          transaction_count: transactions.length
        })
        .eq('id', fileRecord.id);

      return { success: true, count: transactions.length };
    } catch (error) {
      logger.error('Error processing Cielo file:', error);
      
      // Atualizar status do arquivo para erro
      if (fileRecord?.id) {
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        await supabase
          .from('conciliation_files')
          .update({ 
            status: 'error', 
            error_message: errorMessage
          })
          .eq('id', fileRecord.id);
      }
    }
  }
}