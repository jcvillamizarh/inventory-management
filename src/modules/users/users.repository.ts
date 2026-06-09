export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'ADMINISTRADOR' | 'OPERADOR' | 'CONSULTA';
  isActive: boolean;
  createdAt: Date;
}

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  save(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findAll(): Promise<User[]>;
}
