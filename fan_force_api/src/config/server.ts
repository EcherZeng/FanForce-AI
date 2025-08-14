// Server Configuration
// 服务器配置

import { ServerConfig } from '@/types';

// Load environment variables
// 加载环境变量
import dotenv from 'dotenv';
dotenv.config();

// Server configuration from environment variables
// 从环境变量获取服务器配置
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'fanforce-ai-super-secret-jwt-key-2024',
  sessionSecret: process.env.SESSION_SECRET || 'fanforce-ai-session-secret-2024',
  
  // Google OAuth configuration / Google OAuth配置
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
  
  // Twitter OAuth configuration / Twitter OAuth配置
  twitterClientId: process.env.TWITTER_CLIENT_ID,
  twitterClientSecret: process.env.TWITTER_CLIENT_SECRET,
  twitterRedirectUri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:3001/api/auth/twitter/callback',
};

// Validate required environment variables
// 验证必需的环境变量
export const validateConfig = (): void => {
  const requiredVars = ['DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn about missing OAuth credentials
  // 警告缺少OAuth凭据
  if (!serverConfig.googleClientId || !serverConfig.googleClientSecret) {
    console.warn('⚠️  Google OAuth credentials not configured');
    console.warn('⚠️  Google OAuth凭据未配置');
  }
  
  if (!serverConfig.twitterClientId || !serverConfig.twitterClientSecret) {
    console.warn('⚠️  Twitter OAuth credentials not configured');
    console.warn('⚠️  Twitter OAuth凭据未配置');
  }
};

// Development mode check
// 开发模式检查
export const isDevelopment = (): boolean => {
  return serverConfig.nodeEnv === 'development';
};

// Production mode check
// 生产模式检查
export const isProduction = (): boolean => {
  return serverConfig.nodeEnv === 'production';
};

export default serverConfig;