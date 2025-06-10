// src/services/edi-parser.ts
import { v4 as uuidv4 } from 'uuid';

interface NormalizedTransaction {
  id: string;
  file_id: string;
  user_id: string;
  date: string;
  amount: number;
  net_amount: number;
  fee: number;
  card_brand: string;
  card_number?: string;
  transaction_type: string;
  installments: number;
  payment_date: string;
  nsu: string;
  auth_code: string;
  status: string;
  conciliation_status: string;
}

export function parseCieloEDIFile(fileContent: string, fileId: string): NormalizedTransaction[] {
  const lines = fileContent.split(/\r?\n/);
  console.log('Total de linhas lidas:', lines.length);

  const transactions: NormalizedTransaction[] = [];
  let currentUserId = 'SEU_USER_ID_ADMIN';

  for (const line of lines) {
    if (line.trim() === '') continue;

    // Log visual para contagem de caracteres
    if (line.startsWith('E')) {
      console.log('Linha completa:', line);
      let marcador = '';
      for (let i = 0; i < Math.min(line.length, 100); i += 10) {
        marcador += (i.toString().padStart(3, '0') + ' ');
      }
      console.log('Posições:   ', marcador);
      let blocos = '';
      for (let i = 0; i < Math.min(line.length, 100); i += 10) {
        blocos += line.substring(i, i+10) + ' ';
      }
      console.log('Blocos:     ', blocos);
    }

    const recordType = line.substring(0, 1);
    console.log(`Processando linha tipo '${recordType}':`, line.substring(0, 50) + '...');

    switch (recordType) {
      case 'E': // Registro de Detalhe da Transação
        try {
          // Offsets corrigidos conforme análise visual do log
          const establishmentCode = line.substring(1, 16).trim();
          const nsu = line.substring(16, 28).trim();
          const transactionDateRaw = line.substring(28, 36).trim(); // AAAAMMDD
          const authCode = line.substring(36, 42).trim();
          const transactionTypeCode = line.substring(42, 44).trim();
          const paymentMethodCode = line.substring(44, 47).trim();
          const cardBrandCode = line.substring(47, 50).trim();
          const installments = parseInt(line.substring(50, 52).trim() || '1', 10);
          const grossAmountRaw = line.substring(52, 65).replace(/[^\d]/g, '').trim(); // 13 caracteres
          const netAmountRaw = line.substring(65, 78).replace(/[^\d]/g, '').trim();   // 13 caracteres
          const feeAmountRaw = line.substring(78, 91).replace(/[^\d]/g, '').trim();   // 13 caracteres
          const paymentDateRaw = line.substring(91, 99).trim();                        // 8 caracteres

          // Log detalhado para debug
          console.log({
            transactionDateRaw,
            grossAmountRaw,
            netAmountRaw,
            feeAmountRaw,
            paymentDateRaw
          });

          // Conversão dos campos
          const date = formatAAAAMMDDtoISODate(transactionDateRaw);
          const payment_date = formatAAAAMMDDtoISODate(paymentDateRaw);
          const amount = grossAmountRaw ? parseFloat(grossAmountRaw) / 100 : 0;
          const net_amount = netAmountRaw ? parseFloat(netAmountRaw) / 100 : 0;
          const fee = feeAmountRaw ? parseFloat(feeAmountRaw) / 100 : 0;

          transactions.push({
            id: uuidv4(),
            file_id: fileId,
            user_id: currentUserId,
            date,
            amount,
            net_amount,
            fee,
            card_brand: mapCardBrand(cardBrandCode),
            card_number: '',
            transaction_type: mapTransactionType(transactionTypeCode),
            installments,
            payment_date,
            nsu,
            auth_code: authCode,
            status: 'Aprovada',
            conciliation_status: 'pending',
          });
        } catch (e) {
          console.error(`Erro ao parsear linha tipo 'E':`, e);
          console.error('Linha com erro:', line);
        }
        break;

      case '0': // Header
        console.log('Header encontrado');
        break;

      case '9': // Trailer
        console.log('Trailer encontrado');
        break;

      default:
        console.log(`Tipo de registro não processado: ${recordType}`);
        break;
    }
  }

  console.log(`Total de transações processadas: ${transactions.length}`);
  return transactions;
}

// Funções auxiliares
function mapCardBrand(code: string): string {
  const brands: { [key: string]: string } = {
    '082': 'Visa',
    '164': 'Mastercard',
    '033': 'American Express',
    '282': 'Elo',
    '888': 'PIX',
  };
  return brands[code] || `Desconhecida (${code})`;
}

function mapTransactionType(code: string): string {
  const types: { [key: string]: string } = {
    '01': 'Débito',
    '02': 'Crédito à Vista',
    '03': 'Crédito Parcelado Loja',
    '04': 'Crédito Parcelado Emissor',
    '30': 'Débito',
    '20': 'Crédito',
  };
  return types[code] || `Desconhecido (${code})`;
}

function formatAAAAMMDDtoISODate(aaaammdd: string): string {
  // Exemplo: '20241218' => '2024-12-18T00:00:00Z'
  if (!aaaammdd || aaaammdd.length !== 8) return '';
  const aaaa = aaaammdd.substring(0, 4);
  const mm = aaaammdd.substring(4, 6);
  const dd = aaaammdd.substring(6, 8);
  return `${aaaa}-${mm}-${dd}T00:00:00Z`;
}