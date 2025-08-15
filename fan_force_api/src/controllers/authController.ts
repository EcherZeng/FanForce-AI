// Authentication Controller
// 认证控制器

import { Request, Response } from 'express';
const { validationResult } = require('express-validator');
import { pool } from '@/config/database';
import { logger } from '@/config/logger';
import { serverConfig } from '@/config/server';
import { generateToken } from '@/middleware/auth';
import {
  User,
  AuthenticatedRequest,
  ICPLoginRequest,
  WalletLoginRequest,
  BindWalletRequest,
  ApiResponse
} from '@/types';
import {AuthType} from '@/constants/commonConstants';

// Google OAuth callback handler
// Google OAuth回调处理器
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;

    // Generate JWT token / 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      googleId: user.google_id,
      role: user.role,
      authType: AuthType.GOOGLE
    });

    // Redirect to frontend with token / 重定向到前端并携带token
    const redirectUrl = `${serverConfig.corsOrigin}/auth/callback?token=${token}&authType=google`;
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.redirect(`${serverConfig.corsOrigin}/?error=google_auth_failed`);
  }
};

// Twitter OAuth callback handler
// Twitter OAuth回调处理器
export const twitterCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;

    // Generate JWT token / 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      twitterId: user.twitter_id,
      role: user.role,
      authType: AuthType.TWITTER
    });

    // Redirect to frontend with token / 重定向到前端并携带token
    const redirectUrl = `${serverConfig.corsOrigin}/auth/callback?token=${token}&authType=twitter`;
    res.redirect(redirectUrl);

  } catch (error) {
    logger.error('Twitter OAuth callback error:', error);
    res.redirect(`${serverConfig.corsOrigin}/?error=twitter_auth_failed`);
  }
};

// ICP Identity login handler
// ICP身份登录处理器
export const icpLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed / 验证失败'
      } as ApiResponse);
      return;
    }

    const { principalId, identity }: ICPLoginRequest = req.body;

    logger.info('🔐 ICP身份登录请求 / ICP Identity login request:', principalId);

    // Find or create user based on Principal ID
    // 查找或创建基于Principal ID的用户
    let userResult;
    try {
      userResult = await pool.query('SELECT * FROM users WHERE icp_principal_id = $1', [principalId]);
      logger.info('📊 数据库查询结果 / Database query result:', userResult.rows.length, 'rows found');
    } catch (dbError) {
      logger.error('❌ 数据库查询错误 / Database query error:', dbError);
      throw dbError;
    }

    if (userResult.rows.length === 0) {
      // Create new ICP user / 创建新的ICP用户
      logger.info('👤 创建新的ICP用户 / Creating new ICP user:', principalId);
      const newUserResult = await pool.query(
        'INSERT INTO users (icp_principal_id, role, auth_type, wallet_address, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [principalId, 'audience', 'icp', null]
      );
      userResult = newUserResult;
    } else {
      // Update last login time / 更新最后登录时间
      await pool.query('UPDATE users SET updated_at = NOW() WHERE icp_principal_id = $1', [principalId]);
      userResult = await pool.query('SELECT * FROM users WHERE icp_principal_id = $1', [principalId]);
    }

    // Generate JWT token / 生成JWT令牌
    const token = generateToken({
      userId: userResult.rows[0].id,
      principalId: userResult.rows[0].icp_principal_id,
      role: userResult.rows[0].role,
      authType: AuthType.ICP,
    });

    logger.info('✅ ICP身份登录成功 / ICP Identity login successful:', userResult.rows[0].id);

    res.json({
      success: true,
      message: 'ICP Identity login successful / ICP身份登录成功',
      data: {
        token,
        user: {
          id: userResult.rows[0].id,
          principalId: userResult.rows[0].icp_principal_id,
          role: userResult.rows[0].role,
          authType: userResult.rows[0].auth_type || 'icp',
          walletAddress: userResult.rows[0].wallet_address,
          ethereumAddress: userResult.rows[0].ethereum_address,
          studentId: userResult.rows[0].student_id,
          createdAt: userResult.rows[0].created_at,
          lastLogin: userResult.rows[0].updated_at,
          canReceiveAirdrop: !!(userResult.rows[0].ethereum_address || 
            (userResult.rows[0].wallet_address && userResult.rows[0].wallet_address.startsWith('0x')))
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ ICP登录错误 / ICP login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error / 服务器内部错误',
      message: 'ICP身份登录失败 / ICP Identity login failed'
    } as ApiResponse);
  }
};

// Bind wallet address to ICP user
// ICP用户绑定钱包地址
export const bindWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed / 验证失败'
      } as ApiResponse);
      return;
    }

    const { walletAddress, signature }: BindWalletRequest = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    logger.info('🔗 ICP用户绑定钱包请求 / ICP user bind wallet request:', userId, walletAddress);

    // Check if user exists and is ICP user / 检查用户是否存在且为ICP用户
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND auth_type = $2', [userId, 'icp']);

    if (userCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'ICP user not found / ICP用户未找到'
      } as ApiResponse);
      return;
    }

    // Check if wallet address is already used by other users
    // 检查钱包地址是否已被其他用户使用
    const walletCheck = await pool.query(
      'SELECT id FROM users WHERE (wallet_address = $1 OR ethereum_address = $1) AND id != $2',
      [walletAddress, userId]
    );

    if (walletCheck.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Wallet address already in use / 钱包地址已被使用'
      } as ApiResponse);
      return;
    }

    // Update user's wallet address / 更新用户的钱包地址
    const updateResult = await pool.query(
      'UPDATE users SET ethereum_address = $1, auth_type = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [walletAddress, 'hybrid', userId]
    );

    logger.info('✅ 钱包绑定成功 / Wallet binding successful:', walletAddress);

    res.json({
      success: true,
      message: 'Wallet bound successfully / 钱包绑定成功',
      data: {
        user: {
          id: updateResult.rows[0].id,
          principalId: updateResult.rows[0].icp_principal_id,
          role: updateResult.rows[0].role,
          authType: updateResult.rows[0].auth_type,
          walletAddress: updateResult.rows[0].wallet_address,
          ethereumAddress: updateResult.rows[0].ethereum_address,
          canReceiveAirdrop: true
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('❌ 钱包绑定错误 / Wallet binding error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error / 服务器内部错误',
      message: '钱包绑定失败 / Wallet binding failed'
    } as ApiResponse);
  }
};

// Wallet address login handler
// 钱包地址登录处理器
export const walletLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      } as ApiResponse);
      return;
    }

    const { walletAddress, signature }: WalletLoginRequest = req.body;

    // Verify signature (simplified for demo)
    // 验证签名（演示版本简化）
    // In production, you would verify the signature properly
    // 在生产环境中，你需要正确验证签名

    // Find or create user / 查找或创建用户
    let userResult = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);

    if (userResult.rows.length === 0) {
      // Create new user / 创建新用户
      const newUserResult = await pool.query(
        'INSERT INTO users (wallet_address, role, auth_type, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
        [walletAddress, 'audience', 'wallet']
      );
      userResult = newUserResult;
    } else {
      // Update last login time / 更新最后登录时间
      await pool.query('UPDATE users SET updated_at = NOW() WHERE wallet_address = $1', [walletAddress]);
    }

    // Generate JWT token / 生成JWT令牌
    const token = generateToken({
      userId: userResult.rows[0].id,
      walletAddress: userResult.rows[0].wallet_address,
      role: userResult.rows[0].role,
      authType: AuthType.WALLET
    });

    res.json({
      success: true,
      message: 'Login successful / 登录成功',
      data: {
        token,
        user: {
          id: userResult.rows[0].id,
          walletAddress: userResult.rows[0].wallet_address,
          role: userResult.rows[0].role,
          authType: userResult.rows[0].auth_type
        }
      }
    } as ApiResponse);

  } catch (error) {
    logger.error('Wallet login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error / 服务器内部错误'
    } as ApiResponse);
  }
};