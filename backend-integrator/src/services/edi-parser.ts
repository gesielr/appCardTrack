// src/services/edi-parser.ts
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos se necessário

// Defina a estrutura de uma transação normalizada
interface NormalizedTransaction {
  id: string; // UUID gerado
  file_id: string; // ID do arquivo de conciliação
  user_id: string; // ID do usuário associado
  date: string; // Data da transação (ISO string)
  amount: number; // Valor bruto
  net_amount: number; // Valor líquido
  fee: number; // Taxa
  card_brand: string;
  card_number?: string; // Últimos 4 dígitos
  transaction_type: string; // Débito, Crédito à Vista, Parcelado, PIX
  installments: number;
  payment_date: string; // Data de pagamento (ISO string)
  nsu: string;
  auth_code: string;
  status: string; // Aprovada, Cancelada, etc.
  conciliation_status: string; // pending
}

export function parseCieloEDIFile(fileContent: string, fileId: string): NormalizedTransaction[] {
  const lines = fileContent.split('\n');
  const transactions: NormalizedTransaction[] = [];
  let currentUserId = 'SEU_USER_ID_ADMIN'; // Ou extraia do Header do arquivo se disponível

  for (const line of lines) {
    if (line.trim() === '') continue;

    const recordType = line.substring(0, 1); // O primeiro caractere indica o tipo de registro (0, D, E, 8, A, B, C, R, 9)

    switch (recordType) {
      case '0': // Header
        // Exemplo: Extrair o ID do estabelecimento ou outras informações do header
        // const establishmentId = line.substring(1, 11).trim();
        // currentUserId = mapEstablishmentIdToUserId(establishmentId); // Você precisaria de uma função para mapear
        break;
      case 'E': // Detalhe do Lançamento (UR analítica) - Mais comum para vendas/ajustes
        try {
          // **ESTE É ONDE VOCÊ VAI USAR O MANUAL DA CIELO INTENSIVAMENTE**
          // Exemplo de extração (posições do manual):
          const transactionDate = line.substring(566, 574); // DDMMAAAA
          const rawAmount = line.substring(248, 261); // Valor total da venda
          const rawNetAmount = line.substring(276, 289); // Valor líquido
          const rawFee = line.substring(430, 443); // Valor tarifa administrativa
          const cardBrandCode = line.substring(12, 15); // Bandeira de liquidação
          const transactionTypeCode = line.substring(28, 30); // Tipo de lançamento
          const nsu = line.substring(176, 182); // NSU/DOC
          const authCode = line.substring(22, 28); // Código de autorização
          const paymentDate = line.substring(630, 638); // Data de vencimento original
          const installments = parseInt(line.substring(20, 22), 10); // Número total de parcelas

          // Mapeamento de códigos para nomes legíveis (você precisará de tabelas de mapeamento)
          const mappedCardBrand = mapCardBrand(cardBrandCode);
          const mappedTransactionType = mapTransactionType(transactionTypeCode);
          const mappedStatus = 'Aprovada'; // Ou extraia do arquivo se houver um campo de status

          transactions.push({
            id: uuidv4(),
            file_id: fileId,
            user_id: currentUserId,
            date: formatDDMMAAAAtoISODate(transactionDate),
            amount: parseFloat(rawAmount) / 100, // Dividir por 100 se o valor vier sem decimal
            net_amount: parseFloat(rawNetAmount) / 100,
            fee: parseFloat(rawFee) / 100,
            card_brand: mappedCardBrand,
            card_number: line.substring(172, 176), // Últimos 4 dígitos
            transaction_type: mappedTransactionType,
            installments: isNaN(installments) ? 1 : installments,
            payment_date: formatDDMMAAAAtoISODate(paymentDate),
            nsu: nsu,
            auth_code: authCode,
            status: mappedStatus,
            conciliation_status: 'pending',
          });
        } catch (e) {
          console.error(`Erro ao parsear linha tipo 'E': ${line.substring(0, 50)}... Erro: ${e.message}`);
          // Você pode querer registrar essas linhas com erro em algum lugar
        }
        break;
      case '8': // Detalhe da Transação Pix
        // Implemente a lógica de parsing para transações Pix aqui
        // Similar ao caso 'E', mas com campos específicos do Registro 8
        break;
      // Adicione outros tipos de registro (D, A, B, C, R) conforme a necessidade de conciliação
      case '9': // Trailer
        // Exemplo: Validar somatórias do arquivo com o que foi processado
        // const totalTransactionsInFile = parseInt(line.substring(1, 12).trim(), 10);
        // if (transactions.length !== totalTransactionsInFile) {
        //   console.warn(`Contagem de transações no arquivo (${totalTransactionsInFile}) difere do parseado (${transactions.length})`);
        // }
        break;
      default:
        // console.log(`Tipo de registro desconhecido ou não processado: ${recordType}`);
        break;
    }
  }
  return transactions;
}

// Funções auxiliares de mapeamento e formatação (você precisará criar tabelas de mapeamento)
function mapCardBrand(code: string): string {
  const brands: { [key: string]: string } = {
    '001': 'Visa',
    '002': 'Mastercard',
    '003': 'American Express',
    '007': 'Elo',
    '888': 'Pix', // Pix é uma "bandeira" no contexto da Cielo para transações Pix
    // Adicione outros códigos de bandeira do manual
  };
  return brands[code] || `Desconhecida (${code})`;
}

function mapTransactionType(code: string): string {
  const types: { [key: string]: string } = {
    '01': 'Débito',
    '02': 'Crédito à Vista',
    '03': 'Crédito Parcelado',
    '04': 'Ajuste a Débito',
    '05': 'Ajuste a Crédito',
    '06': 'Cancelamento de Venda',
    '08': 'Contestação',
    '42': 'Venda Voucher',
    // Adicione outros códigos de tipo de lançamento do manual
  };
  return types[code] || `Desconhecido (${code})`;
}

function formatDDMMAAAAtoISODate(ddmmaaaa: string): string {
  if (ddmmaaaa.length !== 8) return '';
  const day = ddmmaaaa.substring(0, 2);
  const month = ddmmaaaa.substring(2, 4);
  const year = ddmmaaaa.substring(4, 8);
  return `${year}-${month}-${day}T00:00:00Z`; // Formato ISO 8601 UTC
}