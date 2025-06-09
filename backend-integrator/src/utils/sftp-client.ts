// Placeholder for SFTPClient
export class SFTPClient {
  async connect(config: any) {}
  async list(path: string) { return []; }
  async get(path: string) { return ''; }
  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
