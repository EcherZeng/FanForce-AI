// Environment Configuration Management
// 环境变量配置管理

import dotenv from 'dotenv';
import { logger } from './logger';

// Load environment variables
// 加载环境变量
dotenv.config();

// Environment validation helper
// 环境变量验证助手
class EnvironmentValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate required environment variable
   * 验证必需的环境变量
   */
  requireVar(name: string, description?: string): string {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      this.errors.push(`Missing required environment variable: ${name}${description ? ` (${description})` : ''}`);
      return '';
    }
    return value.trim();
  }

  /**
   * Get optional environment variable with default
   * 获取可选的环境变量，提供默认值
   */
  optionalVar(name: string, defaultValue: string, description?: string): string {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      if (process.env.NODE_ENV === 'production') {
        this.warnings.push(`Using default value for ${name}${description ? ` (${description})` : ''}`);
      }
      return defaultValue;
    }
    return value.trim();
  }

  /**
   * Validate integer environment variable
   * 验证整数类型环境变量
   */
  requireInt(name: string, min?: number, max?: number): number {
    const value = this.requireVar(name);
    const parsed = parseInt(value, 10);
    
    if (isNaN(parsed)) {
      this.errors.push(`Environment variable ${name} must be a valid integer`);
      return 0;
    }
    
    if (min !== undefined && parsed < min) {
      this.errors.push(`Environment variable ${name} must be >= ${min}`);
    }
    
    if (max !== undefined && parsed > max) {
      this.errors.push(`Environment variable ${name} must be <= ${max}`);
    }
    
    return parsed;
  }

  /**
   * Check validation results and throw if errors exist
   * 检查验证结果，如果有错误则抛出异常
   */
  validate(): void {
    if (this.warnings.length > 0) {
      this.warnings.forEach(warning => {
        logger.warn(`⚠️  ${warning}`);
      });
    }

    if (this.errors.length > 0) {
      const errorMessage = `Environment configuration errors:\n${this.errors.map(err => `  - ${err}`).join('\n')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    logger.info('✅ Environment configuration validated successfully');
    logger.info('✅ 环境配置验证成功');
  }
}

// Create validator instance
// 创建验证器实例
const validator = new EnvironmentValidator();

// Database Environment Variables
// 数据库环境变量
export const databaseEnv = {
  host: validator.optionalVar('DB_HOST', 'localhost', 'Database host'),
  port: parseInt(validator.optionalVar('DB_PORT', '5432', 'Database port'), 10),
  name: validator.optionalVar('DB_NAME', 'fanforce_ai', 'Database name'),
  user: validator.optionalVar('DB_USER', 'postgres', 'Database user'),
  password: validator.requireVar('DB_PASSWORD', 'Database password - REQUIRED for security'),
} as const;

// Server Environment Variables
// 服务器环境变量
export const serverEnv = {
  port: parseInt(validator.optionalVar('PORT', '3001', 'Server port'), 10),
  nodeEnv: validator.optionalVar('NODE_ENV', 'development', 'Node environment'),
  corsOrigin: validator.optionalVar('CORS_ORIGIN', 'http://localhost:3000', 'CORS origin'),
  jwtSecret: validator.requireVar('JWT_SECRET', 'JWT secret key - REQUIRED for security'),
  sessionSecret: validator.requireVar('SESSION_SECRET', 'Session secret key - REQUIRED for security'),
} as const;

// OAuth Environment Variables
// OAuth环境变量
export const oauthEnv = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: validator.optionalVar('GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/auth/google/callback'),
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri: validator.optionalVar('TWITTER_REDIRECT_URI', 'http://localhost:3001/api/auth/twitter/callback'),
  },
} as const;

// Logging Environment Variables
// 日志环境变量
export const loggingEnv = {
  level: validator.optionalVar('LOG_LEVEL', 'info', 'Logging level'),
} as const;

// Validate all environment variables
// 验证所有环境变量
export const validateEnvironment = (): void => {
  validator.validate();
  
  // Additional OAuth warnings
  // 额外的OAuth警告
  if (!oauthEnv.google.clientId || !oauthEnv.google.clientSecret) {
    logger.warn('⚠️  Google OAuth credentials not configured - Google login will be disabled');
    logger.warn('⚠️  Google OAuth凭据未配置 - Google登录将被禁用');
  }
  
  if (!oauthEnv.twitter.clientId || !oauthEnv.twitter.clientSecret) {
    logger.warn('⚠️  Twitter OAuth credentials not configured - Twitter login will be disabled');
    logger.warn('⚠️  Twitter OAuth凭据未配置 - Twitter登录将被禁用');
  }
};

// Environment info for debugging
// 用于调试的环境信息
export const getEnvironmentInfo = () => ({
  nodeEnv: serverEnv.nodeEnv,
  port: serverEnv.port,
  database: {
    host: databaseEnv.host,
    port: databaseEnv.port,
    name: databaseEnv.name,
    user: databaseEnv.user,
    // Never expose password in logs
    // 永远不要在日志中暴露密码
    passwordConfigured: !!databaseEnv.password,
  },
  oauth: {
    googleConfigured: !!(oauthEnv.google.clientId && oauthEnv.google.clientSecret),
    twitterConfigured: !!(oauthEnv.twitter.clientId && oauthEnv.twitter.clientSecret),
  },
});