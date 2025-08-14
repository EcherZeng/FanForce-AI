// Authentication Routes
// 认证路由

import { Router } from 'express';
import passport from '@/config/passport';
const { body } = require('express-validator');
import { authenticateToken } from '@/middleware/auth';
import {
  googleCallback,
  twitterCallback,
  icpLogin,
  bindWallet,
  walletLogin
} from '@/controllers/authController';

const router = Router();

// Google OAuth2 Login Routes / Google OAuth2登录路由
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  googleCallback
);

// Twitter OAuth Login Routes / Twitter OAuth登录路由
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  twitterCallback
);

// ICP Identity Login Route / ICP身份登录路由
router.post('/icp-login', [
  body('principalId')
    .isLength({ min: 1 })
    .withMessage('Principal ID is required / Principal ID是必需的'),
  body('identity').optional()
], icpLogin);

// Bind Wallet Address Route / 绑定钱包地址路由
router.post('/bind-wallet', 
  authenticateToken,
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Invalid wallet address / 无效的钱包地址'),
    body('signature')
      .isLength({ min: 1 })
      .withMessage('Signature is required / 签名是必需的')
  ],
  bindWallet
);

// Wallet Address Login Route / 钱包地址登录路由
router.post('/login', [
  body('walletAddress')
    .isEthereumAddress()
    .withMessage('Invalid wallet address / 无效的钱包地址'),
  body('signature')
    .isLength({ min: 1 })
    .withMessage('Signature is required / 签名是必需的')
], walletLogin);

export default router;