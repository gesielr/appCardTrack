// Serviço para consumir o endpoint do backend que parseia arquivos EDI

export async function fetchEdiTransactions(nomeArquivo: string) {
  const response = await fetch(`http://localhost:3001/api/parse-arquivo/${nomeArquivo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar transações: ' + response.statusText);
  }
  const data = await response.json();
  return data.transactions;
}
