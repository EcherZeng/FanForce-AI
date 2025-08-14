// Authentication Middleware
// 认证中间件

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload } from '@/types';
import { serverConfig } from '@/config/server';
import { logger } from '@/config/logger';

// JWT authentication middleware
// JWT认证中间件
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      message: '需要访问令牌'
    });
    return;
  }

  jwt.verify(token, serverConfig.jwtSecret, (err, decoded) => {
    if (err) {
      logger.error('JWT verification failed:', err);
      res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: '无效令牌'
      });
      return;
    }

    // Type assertion for decoded JWT payload
    // 对解码的JWT载荷进行类型断言
    (req as AuthenticatedRequest).user = decoded as JWTPayload;
    next();
  });
};

// WebSocket JWT authentication middleware
// WebSocket JWT认证中间件
export const authenticateSocketToken = (socket: any, next: any): void => {
  const token = socket.handshake.auth.token || 
    socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, serverConfig.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      logger.error('Socket JWT verification failed:', err);
      return next(new Error('Authentication error: Invalid token'));
    }

    // Attach user information to socket
    // 将用户信息附加到socket
    const payload = decoded as JWTPayload;
    socket.userId = payload.userId;
    socket.walletAddress = payload.walletAddress;
    socket.userRole = payload.role;
    next();
  });
};

// Role-based authorization middleware
// 基于角色的授权中间件
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: '需要身份验证'
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: '权限不足'
      });
      return;
    }

    next();
  };
};

// Admin only middleware
// 仅管理员中间件
export const requireAdmin = requireRole(['admin']);

// Admin or Ambassador middleware
// 管理员或大使中间件
export const requireAdminOrAmbassador = requireRole(['admin', 'ambassador']);

// Generate JWT token utility
// 生成JWT令牌工具函数
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    payload,
    serverConfig.jwtSecret,
    { expiresIn: '24h' }
  );
};

// Verify token utility (for non-middleware usage)
// 验证令牌工具函数（用于非中间件使用）
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, serverConfig.jwtSecret) as JWTPayload;
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
};