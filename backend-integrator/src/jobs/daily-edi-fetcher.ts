// src/jobs/daily-edi-fetcher.ts
import { CieloEdiService } from '../services/cielo-edi-service';
import config from 'config'; // Usar a biblioteca 'config' para gerenciar configurações

async function runDailyCieloJob() {
  console.log('Iniciando job diário de extratos Cielo...');
  const cieloConfig = config.get('cielo') as any; // Carrega a configuração da Cielo
  const cieloService = new CieloEdiService(cieloConfig);
  await cieloService.fetchFiles('admin');
  console.log('Job diário de extratos Cielo finalizado.');
}

runDailyCieloJob().catch(console.error);