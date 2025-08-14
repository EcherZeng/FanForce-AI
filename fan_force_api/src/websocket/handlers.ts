// WebSocket Event Handlers
// WebSocket事件处理器

import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '@/config/logger';
import {
  StatusUpdateData,
  JoinEventData,
  QRScanData,
  MatchResultData,
  RewardDistributionData
} from '@/types';

// Extended Socket interface with user properties
// 扩展的Socket接口，包含用户属性
interface AuthenticatedSocket extends Socket {
  userId: number;
  walletAddress?: string;
  userRole: string;
}

// WebSocket connection handler
// WebSocket连接处理器
export const handleConnection = (io: SocketIOServer) => {
  return (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    logger.info(`🔗 User connected: ${authSocket.userId} (${authSocket.userRole})`);
    logger.info(`🔗 用户连接: ${authSocket.userId} (${authSocket.userRole})`);

    // Join user to role-based rooms
    // 将用户加入基于角色的房间
    socket.join(`user_${authSocket.userId}`);
    socket.join(`role_${authSocket.userRole}`);

    // Join general notifications room
    // 加入通用通知房间
    socket.join('general_notifications');

    // Send welcome message with user info
    // 发送欢迎消息和用户信息
    socket.emit('connected', {
      message: 'Connected to FanForce AI real-time server',
      message_cn: '已连接到FanForce AI实时服务器',
      userId: authSocket.userId,
      role: authSocket.userRole,
      timestamp: new Date().toISOString()
    });

    // Register event handlers
    // 注册事件处理器
    socket.on('update_status', handleStatusUpdate(io, authSocket));
    socket.on('join_event', handleJoinEvent(io, authSocket));
    socket.on('qr_scan', handleQRScan(io, authSocket));
    socket.on('match_result', handleMatchResult(io, authSocket));
    socket.on('reward_distribution', handleRewardDistribution(io, authSocket));
    socket.on('ping', handlePing(authSocket));
    socket.on('disconnect', handleDisconnect(authSocket));
  };
};

// Handle user status updates
// 处理用户状态更新
export const handleStatusUpdate = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  return async (data: StatusUpdateData) => {
    try {
      logger.info(`📊 Status update from user ${socket.userId}: ${JSON.stringify(data)}`);

      // Broadcast to role-specific rooms
      // 广播到特定角色房间
      io.to(`role_${socket.userRole}`).emit('user_status_update', {
        userId: socket.userId,
        role: socket.userRole,
        status: data.status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Status update error:', error);
      socket.emit('error', { 
        message: 'Status update failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};

// Handle event participation updates
// 处理活动参与更新
export const handleJoinEvent = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  return async (data: JoinEventData) => {
    try {
      const { eventId } = data;
      logger.info(`🎯 User ${socket.userId} joining event ${eventId}`);

      // Join event-specific room
      // 加入特定活动房间
      socket.join(`event_${eventId}`);

      // Notify other participants
      // 通知其他参与者
      socket.to(`event_${eventId}`).emit('participant_joined', {
        userId: socket.userId,
        role: socket.userRole,
        eventId: eventId,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to user
      // 向用户发送确认
      socket.emit('event_joined', {
        message: `Successfully joined event ${eventId}`,
        message_cn: `成功加入活动 ${eventId}`,
        eventId: eventId
      });

    } catch (error) {
      logger.error('Join event error:', error);
      socket.emit('error', { 
        message: 'Failed to join event', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};

// Handle QR code scanning events
// 处理二维码扫描事件
export const handleQRScan = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  return async (data: QRScanData) => {
    try {
      const { eventId, scanResult } = data;
      logger.info(`📱 QR scan from user ${socket.userId} for event ${eventId}: ${scanResult}`);

      // Notify admins and ambassadors
      // 通知管理员和大使
      io.to('role_admin').to('role_ambassador').emit('qr_scan_update', {
        userId: socket.userId,
        eventId: eventId,
        scanResult: scanResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('QR scan error:', error);
      socket.emit('error', { 
        message: 'QR scan processing failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};

// Handle match result updates (admin/ambassador only)
// 处理比赛结果更新（仅管理员/大使）
export const handleMatchResult = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  return async (data: MatchResultData) => {
    try {
      if (socket.userRole !== 'admin' && socket.userRole !== 'ambassador') {
        socket.emit('error', { message: 'Unauthorized to update match results' });
        return;
      }

      const { eventId, teamAScore, teamBScore, winningTeam } = data;
      logger.info(`🏆 Match result update: Event ${eventId}, Team A: ${teamAScore}, Team B: ${teamBScore}, Winner: ${winningTeam}`);

      // Broadcast to all event participants
      // 广播给所有活动参与者
      io.to(`event_${eventId}`).emit('match_result_update', {
        eventId: eventId,
        teamAScore: teamAScore,
        teamBScore: teamBScore,
        winningTeam: winningTeam,
        timestamp: new Date().toISOString(),
        updatedBy: socket.userId
      });

      // Broadcast to general notifications
      // 广播到通用通知
      io.to('general_notifications').emit('match_completed', {
        message: `Match completed for event ${eventId}`,
        message_cn: `活动 ${eventId} 的比赛已完成`,
        eventId: eventId,
        result: `Team ${winningTeam} wins!`
      });

    } catch (error) {
      logger.error('Match result error:', error);
      socket.emit('error', { 
        message: 'Failed to update match result', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};

// Handle reward distribution notifications
// 处理奖励分配通知
export const handleRewardDistribution = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  return async (data: RewardDistributionData) => {
    try {
      if (socket.userRole !== 'admin') {
        socket.emit('error', { message: 'Unauthorized to distribute rewards' });
        return;
      }

      const { eventId, recipients } = data;
      logger.info(`💰 Reward distribution for event ${eventId} to ${recipients.length} recipients`);

      // Notify each recipient individually
      // 单独通知每个接收者
      recipients.forEach(recipient => {
        io.to(`user_${recipient.userId}`).emit('reward_received', {
          message: `You received ${recipient.amount} CHZ reward!`,
          message_cn: `您获得了 ${recipient.amount} CHZ奖励！`,
          amount: recipient.amount,
          eventId: eventId,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      logger.error('Reward distribution error:', error);
      socket.emit('error', { 
        message: 'Failed to distribute rewards', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
};

// Handle ping/pong for connection health
// 处理ping/pong以检测连接健康状况
export const handlePing = (socket: AuthenticatedSocket) => {
  return () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  };
};

// Handle disconnection
// 处理断开连接
export const handleDisconnect = (socket: AuthenticatedSocket) => {
  return (reason: string) => {
    logger.info(`🔌 User disconnected: ${socket.userId} (${socket.userRole}) - Reason: ${reason}`);
    logger.info(`🔌 用户断开连接: ${socket.userId} (${socket.userRole}) - 原因: ${reason}`);

    // Notify user's event rooms about disconnection
    // 通知用户的活动房间关于断开连接
    socket.rooms.forEach(room => {
      if (room.startsWith('event_')) {
        socket.to(room).emit('participant_disconnected', {
          userId: socket.userId,
          role: socket.userRole,
          timestamp: new Date().toISOString()
        });
      }
    });
  };
};