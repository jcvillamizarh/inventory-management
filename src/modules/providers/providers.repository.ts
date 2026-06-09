export interface Provider {
  id: number;
  nitCedula: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: Date;
}

export interface IProviderRepository {
  findByNitCedula(nitCedula: string): Promise<Provider | null>;
  save(provider: Omit<Provider, 'id' | 'createdAt'>): Promise<Provider>;
}
