// Serviço para buscar e consolidar dados dos arquivos EDI para o Dashboard
import { fetchEdiTransactions } from '../services/ediApi';
import { Transaction } from '../types';

const arquivosTeste = [
  'CIELO03_1002022022_20241218_V151039123123999.txt',
  'CIELO04_1002022022_20241218_V151039123123999.txt',
];

export async function fetchDashboardEdiData(): Promise<Transaction[]> {
  let all: Transaction[] = [];
  for (const nomeArquivo of arquivosTeste) {
    try {
      const transactions = await fetchEdiTransactions(nomeArquivo);
      // Adaptar para o tipo Transaction do dashboard
      all = all.concat(
        transactions.map((t: any) => ({
          id: t.id,
          date: t.date,
          description: t.transaction_type + ' - ' + (t.card_brand || ''),
          amount: t.amount / 100,
          type: inferType(t),
          status: t.status || 'pending',
          paymentMethod: t.card_brand,
          created_at: t.payment_date,
        }))
      );
    } catch (e) {
      // Ignorar arquivo não encontrado ou erro de parser
      continue;
    }
  }
  return all;
}

function inferType(t: any): 'credit' | 'debit' | 'pix' {
  if ((t.transaction_type || '').toLowerCase().includes('débito')) return 'debit';
  if ((t.transaction_type || '').toLowerCase().includes('pix')) return 'pix';
  return 'credit';
}
