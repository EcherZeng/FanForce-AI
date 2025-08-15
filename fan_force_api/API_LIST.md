 公开访问端点 (5个):
GET /health - 系统健康检查
GET /api/auth/google - Google OAuth登录
GET /api/auth/google/callback - Google OAuth回调
GET /api/auth/twitter - Twitter OAuth登录
GET /api/auth/twitter/callback - Twitter OAuth回调
POST /api/auth/icp-login - ICP身份登录
POST /api/auth/login - 钱包地址登录
🔒 需要认证的端点 (4个):
POST /api/auth/bind-wallet - 绑定钱包地址
GET /api/users/profile - 获取用户资料
PUT /api/users/profile - 更新用户资料
GET /api/users/stats - 获取用户统计信息