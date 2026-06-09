export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IAuthRepository {
  findByUsername(username: string): Promise<User | null>;
}
