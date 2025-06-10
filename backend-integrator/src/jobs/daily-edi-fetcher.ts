// src/jobs/daily-edi-fetcher.ts
import { CieloEdiService } from '../services/cielo-edi-service';
import config from 'config'; // Usar a biblioteca 'config' para gerenciar configurações
import logger from '../utils/logger';

async function runDailyCieloJob() {
  logger.info('Iniciando job diário de extratos Cielo...');
  const cieloConfig = config.get('cielo') as any; // Carrega a configuração da Cielo
  const cieloService = new CieloEdiService(cieloConfig);
  await cieloService.fetchFiles('admin');
  logger.info('Job diário de extratos Cielo finalizado.');
}

runDailyCieloJob().catch((err) => logger.error('Erro no job diário da Cielo', err));