// FanForce AI Backend API Server - TypeScript Express Framework
// FanForce AI 后端API服务器 - TypeScript Express框架

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import configurations
// 导入配置
import { serverConfig, validateConfig, isDevelopment } from '@/config/server';
import { testDatabaseConnection, closeDatabaseConnection } from '@/config/database';
import { logger, loggerStream } from '@/config/logger';
import passport from '@/config/passport';

// Import middleware
// 导入中间件
import { authenticateSocketToken } from '@/middleware/auth';

// Import routes
// 导入路由
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';

// Import WebSocket handlers
// 导入WebSocket处理器
import { handleConnection } from '@/websocket/handlers';

// Validate configuration on startup
// 启动时验证配置
try {
  validateConfig();
  logger.info('✅ Configuration validated successfully');
  logger.info('✅ 配置验证成功');
} catch (error) {
  logger.error('❌ Configuration validation failed:', error);
  logger.error('❌ 配置验证失败:', error);
  process.exit(1);
}

// Create Express app
// 创建Express应用
const app = express();

// Create HTTP server for Socket.io integration
// 为Socket.io集成创建HTTP服务器
const server = createServer(app);

// Initialize Socket.io with CORS configuration
// 使用CORS配置初始化Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: serverConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Security middleware
// 安全中间件
app.use(helmet({
  contentSecurityPolicy: isDevelopment() ? false : undefined,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting middleware
// 速率限制中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes / 15分钟
  max: 100, // Limit each IP to 100 requests per windowMs / 每个IP在windowMs内限制100个请求
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    message: '来自此IP的请求过多，请稍后再试。'
  }
});
app.use('/api/', limiter);

// CORS configuration
// CORS配置
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging middleware
// 请求日志中间件
app.use(morgan('combined', {
  stream: loggerStream
}));

// Session middleware for Passport / Passport的会话中间件
app.use(session({
  secret: serverConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: !isDevelopment(),
    maxAge: 24 * 60 * 60 * 1000 // 24 hours / 24小时
  }
}));

// Passport middleware / Passport中间件
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware
// 请求体解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // Simple database health check
    // 简单的数据库健康检查
    const { pool } = await import('@/config/database');
    const dbResult = await pool.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'healthy',
      message: 'FanForce AI API is running',
      message_cn: 'FanForce AI API正在运行',
      timestamp: dbResult.rows[0].current_time,
      database: 'connected',
      environment: serverConfig.nodeEnv,
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// WebSocket authentication and connection handling
// WebSocket认证和连接处理
io.use(authenticateSocketToken);
io.on('connection', handleConnection(io));

// Error handling middleware
// 错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: '出现了问题！'
  });
});

// 404 handler
// 404处理器
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: '路由未找到'
  });
});

// Initialize database connection and start server
// 初始化数据库连接并启动服务器
const startServer = async (): Promise<void> => {
  try {
    // Test database connection (skip if not available)
    // 测试数据库连接（如果不可用则跳过）
    try {
      await testDatabaseConnection();
    } catch (dbError) {
      logger.warn('Database connection failed, starting without database');
      logger.warn('数据库连接失败，在无数据库模式下启动');
      logger.warn('Some features may not work properly without database');
    }
    
    // Start server with Socket.io support
    // 启动支持Socket.io的服务器
    server.listen(serverConfig.port, () => {
      logger.info(`🚀 FanForce AI API server running on port ${serverConfig.port}`);
      logger.info(`🚀 FanForce AI API服务器运行在端口 ${serverConfig.port}`);
      logger.info(`🌐 Environment: ${serverConfig.nodeEnv}`);
      logger.info(`📍 Health check: http://localhost:${serverConfig.port}/health`);
      logger.info(`🔗 WebSocket server: ws://localhost:${serverConfig.port}`);
      logger.info(`🔗 WebSocket服务器: ws://localhost:${serverConfig.port}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    logger.error('启动服务器失败:', error);
    process.exit(1);
  }
};

// Graceful shutdown
// 优雅关闭
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);
  logger.info(`收到${signal}，正在优雅关闭`);
  
  try {
    // Close Socket.io server
    // 关闭Socket.io服务器
    io.close();
    
    // Close database connections
    // 关闭数据库连接
    await closeDatabaseConnection();
    
    // Close HTTP server
    // 关闭HTTP服务器
    server.close(() => {
      logger.info('Server closed');
      logger.info('服务器已关闭');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
// 处理优雅关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('未处理的Promise拒绝:', promise, '原因:', reason);
});

// Handle uncaught exceptions
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

// Start the server
// 启动服务器
startServer();

export default app;