# FanForce AI API 端点文档

## 基本信息
- **服务器地址**: `http://localhost:3001`
- **API版本**: `v1`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 🚀 API端点列表

### 1. 系统健康检查

#### GET `/health`
**描述**: 检查API服务器和数据库连接状态

**认证**: ❌ 不需要

**请求参数**: 无

**响应示例**:
```json
{
  "status": "healthy",
  "message": "FanForce AI API is running",
  "message_cn": "FanForce AI API正在运行",
  "timestamp": "2025-08-15T01:47:19.157Z",
  "database": "connected",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🔐 认证相关API (`/api/auth`)

### 2. Google OAuth登录

#### GET `/api/auth/google`
**描述**: 启动Google OAuth登录流程

**认证**: ❌ 不需要

**查询参数**: 
- `scope`: `['profile', 'email']` (自动设置)

**响应**: 重定向到Google OAuth授权页面

---

#### GET `/api/auth/google/callback`
**描述**: Google OAuth回调处理

**认证**: ❌ 不需要

**响应**: 
- 成功: 重定向到前端应用
- 失败: 重定向到首页

---

### 3. Twitter OAuth登录

#### GET `/api/auth/twitter`
**描述**: 启动Twitter OAuth登录流程

**认证**: ❌ 不需要

**响应**: 重定向到Twitter OAuth授权页面

---

#### GET `/api/auth/twitter/callback`
**描述**: Twitter OAuth回调处理

**认证**: ❌ 不需要

**响应**: 
- 成功: 重定向到前端应用
- 失败: 重定向到首页

---

### 4. ICP身份登录

#### POST `/api/auth/icp-login`
**描述**: 使用ICP Principal ID登录

**认证**: ❌ 不需要

**请求参数**:
```json
{
  "principalId": "rdmx6-jaaaa-aaaah-qcaiq-cai"
}
```

**参数验证**:
- `principalId` (必需): ICP Principal ID

**响应示例**:
```json
{
  "success": true,
  "message": "ICP Identity login successful / ICP身份登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "4300859e-ae3f-45b4-b01b-7c76ebcd67b0",
      "principalId": "rdmx6-jaaaa-aaaah-qcaiq-cai",
      "role": "audience",
      "authType": "icp",
      "walletAddress": null,
      "ethereumAddress": null,
      "studentId": null,
      "createdAt": "2025-08-15T01:47:19.157Z",
      "lastLogin": "2025-08-15T01:47:19.157Z",
      "canReceiveAirdrop": false
    }
  }
}
```

---

### 5. 钱包地址登录

#### POST `/api/auth/login`
**描述**: 使用钱包地址和签名登录

**认证**: ❌ 不需要

**请求参数**:
```json
{
  "walletAddress": "0x742d35Cc6635C0532925a3b8D1C22A4532BEB7bD",
  "signature": "0x..."
}
```

**参数验证**:
- `walletAddress` (必需): 有效的以太坊地址
- `signature` (必需): 签名字符串

**响应示例**:
```json
{
  "success": true,
  "message": "Login successful / 登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "61c5d1ac-82f3-4117-9571-fe48fb5f5e63",
      "walletAddress": "0x742d35Cc6635C0532925a3b8D1C22A4532BEB7bD",
      "role": "audience",
      "authType": "wallet"
    }
  }
}
```

---

### 6. 绑定钱包地址

#### POST `/api/auth/bind-wallet`
**描述**: 为已登录的ICP用户绑定钱包地址

**认证**: ✅ 需要JWT Token

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求参数**:
```json
{
  "walletAddress": "0x742d35Cc6635C0532925a3b8D1C22A4532BEB7bD",
  "signature": "0x..."
}
```

**参数验证**:
- `walletAddress` (必需): 有效的以太坊地址
- `signature` (必需): 签名字符串

---

## 👤 用户相关API (`/api/users`)

> **注意**: 所有用户API都需要JWT认证

### 7. 获取用户资料

#### GET `/api/users/profile`
**描述**: 获取当前用户的详细资料

**认证**: ✅ 需要JWT Token

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "61c5d1ac-82f3-4117-9571-fe48fb5f5e63",
    "username": "用户名",
    "email": "user@example.com",
    "role": "audience",
    "authType": "wallet",
    "walletAddress": "0x742d35Cc6635C0532925a3b8D1C22A4532BEB7bD",
    "createdAt": "2025-08-15T01:47:19.157Z",
    "lastLogin": "2025-08-15T01:47:19.157Z"
  }
}
```

---

### 8. 更新用户资料

#### PUT `/api/users/profile`
**描述**: 更新当前用户的资料信息

**认证**: ✅ 需要JWT Token

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求参数** (所有参数都是可选的):
```json
{
  "username": "新用户名",
  "email": "new@example.com",
  "studentId": "12345678",
  "profileData": {
    "bio": "个人简介",
    "avatar": "头像URL"
  }
}
```

---

### 9. 获取用户统计信息

#### GET `/api/users/stats`
**描述**: 获取当前用户的统计数据

**认证**: ✅ 需要JWT Token

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalEvents": 5,
    "totalRewards": 1000,
    "currentLevel": "Bronze",
    "achievementCount": 3
  }
}
```

---

## ❌ 错误响应格式

所有API在发生错误时都返回统一的错误格式：

```json
{
  "success": false,
  "error": "Error type in English",
  "message": "错误描述中文"
}
```

### 常见错误状态码:

- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未提供认证token或token无效
- **403 Forbidden**: 权限不足
- **404 Not Found**: 路由不存在
- **429 Too Many Requests**: 请求频率限制
- **500 Internal Server Error**: 服务器内部错误

### 认证错误示例:
```json
{
  "success": false,
  "error": "Access token required",
  "message": "需要访问令牌"
}
```

---

## � 中间件和安全特性

- **Helmet**: 安全头部设置
- **CORS**: 跨域请求支持 (允许 `http://localhost:3000`)
- **Rate Limiting**: 请求频率限制 (100次/15分钟)
- **Request Logging**: Morgan日志记录
- **Input Validation**: express-validator参数验证
- **JWT Authentication**: JSON Web Token认证

---

## 📊 API统计

- **总端点数**: 9个
- **需要认证的端点**: 4个 (用户相关API + 绑定钱包)
- **公开端点**: 5个 (健康检查 + OAuth登录 + 钱包/ICP登录)
- **支持的HTTP方法**: GET, POST, PUT
- **支持的认证类型**: Wallet, Google OAuth, Twitter OAuth, ICP Identity

---

## � WebSocket支持

除了HTTP API，系统还提供WebSocket实时通信功能，支持以下事件：
- `connection`: 连接建立
- `update_status`: 状态更新
- `join_event`: 加入活动
- `qr_scan`: 二维码扫描
- `match_result`: 比赛结果
- `reward_distribution`: 奖励分配
- `ping/pong`: 连接保活

WebSocket连接也需要JWT认证。