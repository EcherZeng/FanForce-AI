// User Routes
// 用户路由

import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth';
import {
  getProfile,
  updateProfile,
  getUserStats
} from '@/controllers/userController';

const router = Router();

// All user routes require authentication
// 所有用户路由都需要身份验证
router.use(authenticateToken);

// Get user profile / 获取用户资料
router.get('/profile', getProfile);

// Update user profile / 更新用户资料
router.put('/profile', updateProfile);

// Get user statistics / 获取用户统计信息
router.get('/stats', getUserStats);

export default router;