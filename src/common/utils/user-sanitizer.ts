import { User } from '../../entities/user.entity';

export interface SafeUser {
  id: string;
  username: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  birthday?: Date;
  gender?: string;
  height?: number;
  weight?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function sanitizeUser(user: User): SafeUser {
  if (!user) return null;
  const { password, ...safe } = user as any;
  return safe as SafeUser;
}

export function sanitizeUsers(users: User[]): SafeUser[] {
  if (!users || !Array.isArray(users)) return [];
  return users.map((u) => sanitizeUser(u));
}
