// Passport Configuration
// Passport配置

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { pool } from './database';
import { serverConfig } from './server';
import { logger } from './logger';
import { User, GoogleProfile, TwitterProfile } from '@/types';

// Serialize user for session / 序列化用户会话
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session / 从会话反序列化用户
passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0] as User);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth2 Strategy / Google OAuth2策略
if (serverConfig.googleClientId && serverConfig.googleClientSecret && serverConfig.googleRedirectUri) {
  passport.use(new GoogleStrategy({
    clientID: serverConfig.googleClientId,
    clientSecret: serverConfig.googleClientSecret,
    callbackURL: serverConfig.googleRedirectUri
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      logger.info(`🔐 Google OAuth callback for user: ${profile.emails[0]?.value}`);
      
      const googleProfile = profile as GoogleProfile;
      
      // Check if user exists / 检查用户是否存在
      let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleProfile.id]);
      
      if (userResult.rows.length === 0) {
        // Create new user / 创建新用户
        const newUserResult = await pool.query(
          `INSERT INTO users (google_id, email, role, auth_type, profile_data, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [
            googleProfile.id,
            googleProfile.emails[0]?.value || null,
            'audience',
            'google',
            JSON.stringify({
              name: googleProfile.displayName,
              avatar: googleProfile.photos[0]?.value,
              googleId: googleProfile.id
            })
          ]
        );
        userResult = newUserResult;
      } else {
        // Update last login time / 更新最后登录时间
        await pool.query('UPDATE users SET updated_at = NOW() WHERE google_id = $1', [googleProfile.id]);
        userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleProfile.id]);
      }
      
      return done(null, userResult.rows[0] as User);
    } catch (error) {
      logger.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));
}

// Twitter OAuth Strategy / Twitter OAuth策略
if (serverConfig.twitterClientId && serverConfig.twitterClientSecret && serverConfig.twitterRedirectUri) {
  passport.use(new TwitterStrategy({
    consumerKey: serverConfig.twitterClientId,
    consumerSecret: serverConfig.twitterClientSecret,
    callbackURL: serverConfig.twitterRedirectUri
  }, async (token: string, tokenSecret: string, profile: any, done: any) => {
    try {
      logger.info(`🔐 Twitter OAuth callback for user: ${profile.username}`);
      
      const twitterProfile = profile as TwitterProfile;
      
      // Check if user exists / 检查用户是否存在
      let userResult = await pool.query('SELECT * FROM users WHERE twitter_id = $1', [twitterProfile.id]);
      
      if (userResult.rows.length === 0) {
        // Create new user / 创建新用户
        const newUserResult = await pool.query(
          `INSERT INTO users (twitter_id, username, role, auth_type, profile_data, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [
            twitterProfile.id,
            twitterProfile.username,
            'audience',
            'twitter',
            JSON.stringify({
              name: twitterProfile.displayName,
              avatar: twitterProfile.profileImageUrl,
              twitterId: twitterProfile.id,
              screenName: twitterProfile.username
            })
          ]
        );
        userResult = newUserResult;
      } else {
        // Update last login time / 更新最后登录时间
        await pool.query('UPDATE users SET updated_at = NOW() WHERE twitter_id = $1', [twitterProfile.id]);
        userResult = await pool.query('SELECT * FROM users WHERE twitter_id = $1', [twitterProfile.id]);
      }
      
      return done(null, userResult.rows[0] as User);
    } catch (error) {
      logger.error('Twitter OAuth error:', error);
      return done(error, null);
    }
  }));
}

export default passport;