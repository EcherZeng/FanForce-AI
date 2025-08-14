# FanForce AI Backend API - TypeScript Express Framework

FanForce AI 后端API服务器 - 基于TypeScript的Express框架

## 项目概述 / Project Overview

这是一个基于TypeScript和Express框架的FanForce AI后端API服务器，从原始的server.js迁移而来。该项目提供了完整的用户认证、WebSocket实时通信、数据库集成等功能。

This is a FanForce AI backend API server built with TypeScript and Express framework, migrated from the original server.js. The project provides comprehensive user authentication, WebSocket real-time communication, database integration, and more.

## 技术栈 / Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT, Passport.js (Google OAuth, Twitter OAuth)
- **Real-time**: Socket.io
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 项目结构 / Project Structure

```
fan_force_api/
├── src/
│   ├── config/           # 配置文件 / Configuration files
│   │   ├── database.ts   # 数据库配置 / Database configuration
│   │   ├── logger.ts     # 日志配置 / Logger configuration
│   │   ├── passport.ts   # Passport OAuth配置 / Passport OAuth configuration
│   │   └── server.ts     # 服务器配置 / Server configuration
│   ├── controllers/      # 控制器 / Controllers
│   │   ├── authController.ts   # 认证控制器 / Authentication controller
│   │   └── userController.ts   # 用户控制器 / User controller
│   ├── middleware/       # 中间件 / Middleware
│   │   └── auth.ts       # 认证中间件 / Authentication middleware
│   ├── routes/           # 路由 / Routes
│   │   ├── auth.ts       # 认证路由 / Authentication routes
│   │   └── users.ts      # 用户路由 / User routes
│   ├── services/         # 服务层 / Services (待扩展)
│   ├── types/            # 类型定义 / Type definitions
│   │   └── index.ts      # 主要类型定义 / Main type definitions
│   ├── utils/            # 工具函数 / Utility functions (待扩展)
│   ├── websocket/        # WebSocket处理 / WebSocket handlers
│   │   └── handlers.ts   # WebSocket事件处理器 / WebSocket event handlers
│   └── index.ts          # 主应用入口 / Main application entry
├── dist/                 # 编译输出目录 / Compiled output directory
├── logs/                 # 日志文件目录 / Log files directory
├── .env.example          # 环境变量示例 / Environment variables example
├── package.json          # 项目依赖 / Project dependencies
├── tsconfig.json         # TypeScript配置 / TypeScript configuration
└── README.md            # 项目说明 / Project documentation
```

## 安装和使用 / Installation and Usage

### 1. 安装依赖 / Install Dependencies

```bash
cd fan_force_api
npm install
```

### 2. 环境配置 / Environment Configuration

复制环境变量示例文件并配置：
Copy the environment variables example file and configure:

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
Edit the `.env` file and configure the following variables:

```env
# 数据库配置 / Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fanforce_ai
DB_USER=postgres
DB_PASSWORD=your_database_password

# JWT密钥 / JWT Secrets
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key

# OAuth配置 (可选) / OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### 3. 编译项目 / Build Project

```bash
npm run build
```

### 4. 运行项目 / Run Project

开发模式 / Development mode:
```bash
npm run dev
```

生产模式 / Production mode:
```bash
npm start
```

## API端点 / API Endpoints

### 认证 / Authentication

- `GET /api/auth/google` - Google OAuth登录
- `GET /api/auth/twitter` - Twitter OAuth登录
- `POST /api/auth/login` - 钱包地址登录
- `POST /api/auth/icp-login` - ICP身份登录
- `POST /api/auth/bind-wallet` - 绑定钱包地址

### 用户 / Users

- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `GET /api/users/stats` - 获取用户统计信息

### 健康检查 / Health Check

- `GET /health` - 服务健康状态检查

## WebSocket事件 / WebSocket Events

### 客户端事件 / Client Events

- `update_status` - 更新用户状态
- `join_event` - 加入活动
- `qr_scan` - 二维码扫描
- `match_result` - 更新比赛结果 (仅管理员/大使)
- `reward_distribution` - 奖励分配 (仅管理员)
- `ping` - 连接健康检查

### 服务器事件 / Server Events

- `connected` - 连接成功通知
- `user_status_update` - 用户状态更新广播
- `participant_joined` - 参与者加入通知
- `qr_scan_update` - 二维码扫描更新
- `match_result_update` - 比赛结果更新
- `reward_received` - 奖励接收通知
- `pong` - Ping响应

## 功能特性 / Features

### 🔐 多种认证方式 / Multiple Authentication Methods
- JWT令牌认证
- Google OAuth2登录
- Twitter OAuth登录
- ICP身份登录
- 钱包地址登录

### 🚀 实时通信 / Real-time Communication
- Socket.io WebSocket支持
- 基于角色的房间管理
- 事件实时广播
- 连接健康监测

### 🛡️ 安全性 / Security
- Helmet安全头
- CORS跨域保护
- 请求速率限制
- JWT令牌验证

### 📊 日志记录 / Logging
- Winston日志系统
- 多级别日志输出
- 文件和控制台日志
- 错误跟踪

### 🗄️ 数据库集成 / Database Integration
- PostgreSQL连接池
- 自动连接健康检查
- 优雅关闭处理

## 开发脚本 / Development Scripts

```bash
npm run dev          # 开发模式运行 / Run in development mode
npm run build        # 编译TypeScript / Build TypeScript
npm start            # 生产模式运行 / Run in production mode
npm run clean        # 清理构建文件 / Clean build files
```

## 迁移说明 / Migration Notes

该项目从原始的 `server.js` 迁移而来，主要改进包括：

This project is migrated from the original `server.js` with the following improvements:

1. **TypeScript支持** - 完整的类型安全和智能提示
2. **模块化架构** - 清晰的文件组织和职责分离
3. **配置管理** - 集中的配置文件管理
4. **错误处理** - 更好的错误处理和日志记录
5. **代码复用** - 可复用的中间件和工具函数

## 贡献 / Contributing

欢迎提交Issues和Pull Requests来改进项目。
Welcome to submit Issues and Pull Requests to improve the project.

## 许可证 / License

MIT License