// Server Configuration
// 服务器配置

import { ServerConfig } from '@/types';
import { serverEnv, oauthEnv, validateEnvironment } from './environment';

// Server configuration from validated environment variables
// 从验证过的环境变量获取服务器配置
export const serverConfig: ServerConfig = {
  port: serverEnv.port,
  nodeEnv: serverEnv.nodeEnv,
  corsOrigin: serverEnv.corsOrigin,
  jwtSecret: serverEnv.jwtSecret,
  sessionSecret: serverEnv.sessionSecret,
  
  // Google OAuth configuration / Google OAuth配置
  googleClientId: oauthEnv.google.clientId,
  googleClientSecret: oauthEnv.google.clientSecret,
  googleRedirectUri: oauthEnv.google.redirectUri,
  
  // Twitter OAuth configuration / Twitter OAuth配置
  twitterClientId: oauthEnv.twitter.clientId,
  twitterClientSecret: oauthEnv.twitter.clientSecret,
  twitterRedirectUri: oauthEnv.twitter.redirectUri,
};

// Validate all configuration (delegated to environment module)
// 验证所有配置（委托给环境模块）
export const validateConfig = validateEnvironment;

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