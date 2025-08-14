// FanForce AI Backend API Types
// FanForce AI 后端API类型定义

import { Request } from 'express';

// User related types / 用户相关类型
export interface User {
  id: number;
  wallet_address?: string;
  ethereum_address?: string;
  icp_principal_id?: string;
  google_id?: string;
  twitter_id?: string;
  username?: string;
  email?: string;
  role: 'admin' | 'ambassador' | 'athlete' | 'audience';
  auth_type: 'wallet' | 'google' | 'twitter' | 'icp' | 'hybrid';
  student_id?: string;
  profile_data?: any;
  virtual_chz_balance?: number;
  real_chz_balance?: number;
  reliability_score?: number;
  created_at: Date;
  updated_at: Date;
}

// JWT Payload types / JWT载荷类型
export interface JWTPayload {
  userId: number;
  walletAddress?: string;
  principalId?: string;
  googleId?: string;
  twitterId?: string;
  role: string;
  authType: string;
  iat?: number;
  exp?: number;
}

// Extended Request interface / 扩展的请求接口
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Event related types / 事件相关类型
export interface Event {
  id: number;
  title: string;
  description?: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  start_time: Date;
  end_time?: Date;
  venue_id?: number;
  team_a?: string;
  team_b?: string;
  team_a_score?: number;
  team_b_score?: number;
  winning_team?: string;
  created_at: Date;
  updated_at: Date;
}

// Athlete related types / 运动员相关类型
export interface Athlete {
  id: number;
  user_id: number;
  sport: string;
  team?: string;
  position?: string;
  ranking?: number;
  status: 'active' | 'inactive' | 'suspended';
  achievements?: any;
  created_at: Date;
  updated_at: Date;
}

// Venue related types / 场馆相关类型
export interface Venue {
  id: number;
  name: string;
  address?: string;
  capacity?: number;
  facilities?: any;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: Date;
  updated_at: Date;
}

// WebSocket event types / WebSocket事件类型
export interface SocketUser {
  userId: number;
  walletAddress?: string;
  userRole: string;
}

export interface StatusUpdateData {
  status: string;
}

export interface JoinEventData {
  eventId: number;
}

export interface QRScanData {
  eventId: number;
  scanResult: string;
}

export interface MatchResultData {
  eventId: number;
  teamAScore: number;
  teamBScore: number;
  winningTeam: string;
}

export interface RewardRecipient {
  userId: number;
  amount: number;
}

export interface RewardDistributionData {
  eventId: number;
  recipients: RewardRecipient[];
}

// OAuth Profile types / OAuth配置文件类型
export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified?: boolean }>;
  photos: Array<{ value: string }>;
}

export interface TwitterProfile {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

// Database configuration / 数据库配置
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// Server configuration / 服务器配置
export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  jwtSecret: string;
  sessionSecret: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  twitterClientId?: string;
  twitterClientSecret?: string;
  twitterRedirectUri?: string;
}

// API Response types / API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface PaginationResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Login request types / 登录请求类型
export interface WalletLoginRequest {
  walletAddress: string;
  signature: string;
}

export interface ICPLoginRequest {
  principalId: string;
  identity?: any;
}

export interface BindWalletRequest {
  walletAddress: string;
  signature: string;
}