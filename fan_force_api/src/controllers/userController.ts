// User Controller
// 用户控制器

import { Request, Response } from 'express';
import { pool } from '@/config/database';
import { logger } from '@/config/logger';
import { AuthenticatedRequest, ApiResponse } from '@/types';

// Get user profile
// 获取用户资料
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const userResult = await pool.query(
      `SELECT id, wallet_address, ethereum_address, icp_principal_id, google_id, twitter_id, 
              username, email, role, auth_type, student_id, profile_data, 
              virtual_chz_balance, real_chz_balance, reliability_score, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户未找到'
      } as ApiResponse);
      return;
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          ethereumAddress: user.ethereum_address,
          principalId: user.icp_principal_id,
          googleId: user.google_id,
          twitterId: user.twitter_id,
          username: user.username,
          email: user.email,
          role: user.role,
          authType: user.auth_type,
          studentId: user.student_id,
          profileData: user.profile_data,
          virtualChzBalance: user.virtual_chz_balance || 0,
          realChzBalance: user.real_chz_balance || 0,
          reliabilityScore: user.reliability_score || 0,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器内部错误'
    } as ApiResponse);
  }
};

// Update user profile
// 更新用户资料
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    const { username, email, studentId, profileData } = req.body;

    // Build dynamic update query based on provided fields
    // 根据提供的字段构建动态更新查询
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCounter = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCounter++}`);
      updateValues.push(username);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCounter++}`);
      updateValues.push(email);
    }
    if (studentId !== undefined) {
      updateFields.push(`student_id = $${paramCounter++}`);
      updateValues.push(studentId);
    }
    if (profileData !== undefined) {
      updateFields.push(`profile_data = $${paramCounter++}`);
      updateValues.push(JSON.stringify(profileData));
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: '没有要更新的字段'
      } as ApiResponse);
      return;
    }

    // Add updated_at field
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} 
      RETURNING id, username, email, student_id, profile_data, updated_at
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户未找到'
      } as ApiResponse);
      return;
    }

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          studentId: updatedUser.student_id,
          profileData: updatedUser.profile_data,
          updatedAt: updatedUser.updated_at
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器内部错误'
    } as ApiResponse);
  }
};

// Get user statistics
// 获取用户统计信息
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    // Get user basic info
    // 获取用户基本信息
    const userResult = await pool.query(
      'SELECT virtual_chz_balance, real_chz_balance, reliability_score FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: '用户未找到'
      } as ApiResponse);
      return;
    }

    const user = userResult.rows[0];

    // Get participation statistics (if events table exists)
    // 获取参与统计（如果事件表存在）
    let participationStats = null;
    try {
      const participationResult = await pool.query(
        `SELECT 
           COUNT(*) as total_events,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_events
         FROM user_events WHERE user_id = $1`,
        [userId]
      );
      participationStats = participationResult.rows[0];
    } catch (tableError) {
      logger.info('user_events table not found, skipping participation stats');
    }

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        balances: {
          virtualChz: user.virtual_chz_balance || 0,
          realChz: user.real_chz_balance || 0
        },
        reliabilityScore: user.reliability_score || 0,
        participation: participationStats || {
          total_events: 0,
          completed_events: 0,
          active_events: 0
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: '服务器内部错误'
    } as ApiResponse);
  }
};