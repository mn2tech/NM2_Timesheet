import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthToken {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: { headers: Headers | { cookie?: string } }): string | null {
  let cookies = '';
  if (req.headers instanceof Headers) {
    cookies = req.headers.get('cookie') || '';
  } else {
    cookies = req.headers.cookie || '';
  }
  const tokenMatch = cookies.match(/token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

