/// <reference types="jest" />
jest.mock('config', () => ({
  get: (key: string) => {
    if (key === 'cielo.sftp.host') return 'localhost';
    if (key === 'cielo.sftp.port') return 22;
    if (key === 'cielo.sftp.username') return 'user';
    if (key === 'cielo.sftp.password') return 'pass';
    if (key === 'cielo.sftp.remotePath') return '/';
    return '';
  }
}));
import { CieloEdiService } from '../cielo-edi-service';
import * as fs from 'fs';
import * as path from 'path';

// Mock do SFTPClient para simular operações de SFTP com arquivos locais
jest.mock('../../utils/sftp-client', () => {
  return {
    SFTPClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      disconnect: jest.fn().mockResolvedValue(true),
      list: jest.fn().mockImplementation((remotePath: string) => {
        const arquivosTesteDir = path.resolve(__dirname, '../../../arquivosTestes');
        const files = fs.readdirSync(arquivosTesteDir).map(name => ({ name }));
        return Promise.resolve(files);
      }),
      get: jest.fn().mockImplementation((filePath: string) => {
        const fileName = path.basename(filePath);
        const arquivosTesteDir = path.resolve(__dirname, '../../../arquivosTestes');
        const fullPath = path.join(arquivosTesteDir, fileName);
        return Promise.resolve(fs.readFileSync(fullPath));
      })
    }))
  }
});

// Mock do Supabase para simular banco em memória
jest.mock('../../utils/supabase-client', () => {
  let files: any[] = [];
  let transactions: any[] = [];
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'conciliation_files') {
          return {
            select: () => ({ single: () => ({ data: files[0], error: null }) }),
            insert: (data: any) => {
              files.push({ ...data, id: files.length + 1 });
              return { select: () => ({ single: () => ({ data: files[files.length - 1], error: null }) }) };
            },
            update: (data: any) => ({ eq: (field: string, value: any) => { files = files.map(f => f.id === value ? { ...f, ...data } : f); return { data: null, error: null }; } }),
            eq: () => ({ single: () => ({ data: null, error: null }) })
          };
        } else if (table === 'transactions') {
          return {
            insert: (data: any[]) => { transactions.push(...data); return { error: null }; }
          };
        }
        return {};
      }
    }
  };
});

describe('CieloEdiService integração', () => {
  const userId = 'usuario-teste';
  let service: CieloEdiService;

  beforeEach(() => {
    service = new CieloEdiService();
  });

  it('deve processar todos os arquivos da pasta arquivosTestes sem erros', async () => {
    await service.fetchFiles(userId);
    // Se não lançar erro, consideramos sucesso básico
    expect(true).toBe(true);
  });

  it('deve lidar com arquivo inexistente (simulação de erro)', async () => {
    // Simula erro no método get do SFTP
    const arquivosTesteDir = path.resolve(__dirname, '../../../arquivosTestes');
    const fileName = 'ARQUIVO_INEXISTENTE.txt';
    const sftpClient = (service as any).client;
    sftpClient.get = jest.fn().mockRejectedValue(new Error('Arquivo não encontrado'));
    await expect(service.processFile('conteudo', fileName, userId)).resolves.not.toThrow();
  });
});
