import { parseCieloEDIFile } from '../edi-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('parseCieloEDIFile', () => {
  const arquivosTesteDir = path.resolve(__dirname, '../../../arquivosTestes');
  const arquivos = [
    'CIELO03_1002022022_20241218_V151039123123999.txt',
    'CIELO04_1002022022_20241218_V151039123123999.txt',
  ];

  arquivos.forEach((arquivo) => {
    it(`deve parsear corretamente o arquivo de teste ${arquivo}`, () => {
      const filePath = path.join(arquivosTesteDir, arquivo);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const transactions = parseCieloEDIFile(fileContent, arquivo);
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      // Validações básicas de estrutura
      transactions.forEach((t) => {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('file_id');
        expect(t).toHaveProperty('user_id');
        expect(t).toHaveProperty('date');
        expect(t).toHaveProperty('amount');
        expect(t).toHaveProperty('transaction_type');
      });
    });
  });
});
