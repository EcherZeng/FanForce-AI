// Database Configuration
// 数据库配置

import { Pool } from 'pg';
import { DatabaseConfig } from '@/types';
import { logger } from './logger';

// Database configuration from environment variables
// 从环境变量获取数据库配置
export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fanforce_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '654210',
  max: 10, // Maximum number of connections in the pool / 连接池中的最大连接数
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle / 客户端允许保持空闲的时间
  connectionTimeoutMillis: 5000, // How long to wait for a connection / 等待连接的时间
};

// Create database connection pool
// 创建数据库连接池
export const pool = new Pool(databaseConfig);

// Test database connection function
// 测试数据库连接函数
export const testDatabaseConnection = async (): Promise<void> => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    logger.info('Database connected successfully');
    logger.info('数据库连接成功');
    logger.info(`Current time: ${result.rows[0].current_time}`);
  } catch (error) {
    logger.error('Database connection failed:', error);
    logger.error('数据库连接失败:', error);
    throw error;
  }
};

// Graceful database shutdown
// 优雅关闭数据库连接
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database pool closed');
    logger.info('数据库连接池已关闭');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

// Handle database connection errors
// 处理数据库连接错误
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  logger.error('空闲客户端上的意外错误:', err);
});