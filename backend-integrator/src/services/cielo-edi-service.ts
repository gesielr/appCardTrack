// src/services/cielo-edi-service.ts
import { SftpHandler } from '../utils/sftp-client';
import { supabase } from '../utils/supabase-client';
import fs from 'fs/promises';
import path from 'path';
import { parseCieloEDIFile } from './edi-parser'; // Vamos criar isso em seguida

interface CieloConfig {
  sftp: {
    host: string;
    port: number;
    username: string;
    password?: string;
    remoteDir: string;
    localDownloadDir: string;
  };
}

export class CieloEdiService {
  private sftpHandler: SftpHandler;
  private config: CieloConfig;

  constructor(config: CieloConfig) {
    this.sftpHandler = new SftpHandler();
    this.config = config;
  }

  async processNewFiles(): Promise<void> {
    const { sftp: sftpConfig } = this.config;
    const { remoteDir, localDownloadDir } = sftpConfig;

    try {
      await this.sftpHandler.connect(sftpConfig);
      const files = await this.sftpHandler.listFiles(remoteDir);

      for (const fileInfo of files) {
        // Filtra apenas arquivos EDI e evita diretórios
        if (fileInfo.type === '-' && fileInfo.name.endsWith('.edi')) {
          const remoteFilePath = path.join(remoteDir, fileInfo.name);
          const localFilePath = path.join(localDownloadDir, fileInfo.name);

          console.log(`Processando arquivo: ${fileInfo.name}`);

          // 1. Baixar o arquivo
          await this.sftpHandler.downloadFile(remoteFilePath, localFilePath);

          // 2. Registrar o arquivo no Supabase (conciliation_files)
          const { data: fileRecord, error: fileError } = await supabase
            .from('conciliation_files')
            .insert({
              user_id: 'SEU_USER_ID_ADMIN', // ID de um usuário admin ou sistema para rastreio
              filename: fileInfo.name,
              original_filename: fileInfo.name,
              format: 'EDI_CIELO',
              source: 'cielo',
              storage_path: localFilePath, // Ou um caminho no Supabase Storage se você subir o raw file
              status: 'processing',
            })
            .select()
            .single();

          if (fileError) {
            console.error(`Erro ao registrar arquivo no Supabase: ${fileError.message}`);
            continue; // Pula para o próximo arquivo
          }

          // 3. Parsear o arquivo e inserir transações
          try {
            const rawFileContent = await fs.readFile(localFilePath, 'utf-8');
            const parsedTransactions = parseCieloEDIFile(rawFileContent, fileRecord.id); // Passa o file_id
            
            // Inserir transações em lotes para melhor performance
            const { error: transactionsError } = await supabase
              .from('transactions')
              .insert(parsedTransactions);

            if (transactionsError) {
              throw new Error(`Erro ao inserir transações: ${transactionsError.message}`);
            }

            // 4. Atualizar status do arquivo para 'completed'
            await supabase
              .from('conciliation_files')
              .update({ status: 'completed', processed_date: new Date(), transaction_count: parsedTransactions.length })
              .eq('id', fileRecord.id);

            // 5. Opcional: Deletar arquivo do SFTP ou movê-lo para um diretório de "processados"
            // await this.sftpHandler.deleteFile(remoteFilePath);
            
            // 6. Opcional: Deletar arquivo local após processamento
            await fs.unlink(localFilePath);

            console.log(`Arquivo ${fileInfo.name} processado com sucesso.`);

          } catch (parseError) {
            console.error(`Erro ao parsear/processar ${fileInfo.name}: ${parseError.message}`);
            await supabase
              .from('conciliation_files')
              .update({ status: 'error', processed_date: new Date() })
              .eq('id', fileRecord.id);
            // Não deleta o arquivo local para permitir depuração
          }
        }
      }
    } catch (error) {
      console.error(`Erro geral no serviço Cielo EDI: ${error.message}`);
    } finally {
      await this.sftpHandler.disconnect();
    }
  }
}