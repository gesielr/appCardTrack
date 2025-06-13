import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { EDIParser } from './services/edi-parser';

const app = express();
app.use(cors()); // Habilita o CORS para todas as rotas
const PORT = process.env.PORT || 3001;

// Endpoint para parsear e retornar os dados do arquivo EDI

app.get('/api/parse-arquivo/:nomeArquivo', function (req, res) {
  const { nomeArquivo } = req.params;
  const arquivosTesteDir = path.resolve(__dirname, '../arquivosTestes');
  const filePath = path.join(arquivosTesteDir, nomeArquivo);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = EDIParser.parseEDIFile(fileContent);
    return res.json({ transactions: parsed.transactions });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar o arquivo', details: error instanceof Error ? error.message : error });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});
