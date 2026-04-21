import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse, LoginRequest, LoginResponse, JwtPayload } from '../types';

export function loginHandler(req: Request, res: Response<ApiResponse<LoginResponse>>): void {
  const { username, password } = req.body as LoginRequest;

  if (username !== config.admin.username || password !== config.admin.password) {
    res.status(401).json({ code: -1, error: 'Invalid username or password' });
    return;
  }

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = { username, role: 'admin' };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });

  res.json({
    code: 0,
    data: { token, expiresIn: config.jwt.expiresIn },
  });
}

export function authMiddleware(req: Request, res: Response<ApiResponse<never>>, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: -1, error: 'Unauthorized: missing or invalid token' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ code: -1, error: 'Unauthorized: invalid or expired token' });
  }
}

export function clientAuthMiddleware(req: Request, res: Response<ApiResponse<never>>, next: NextFunction): void {
  // Client auth can be simplified — just check for a valid token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: -1, error: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ code: -1, error: 'Unauthorized: invalid token' });
  }
}