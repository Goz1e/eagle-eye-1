import { NextRequest } from 'next/server';
import { prisma } from './db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Simple JWT-like token system for demo purposes
 * In production, use proper JWT libraries like jsonwebtoken
 */
export class AuthService {
  private static readonly SECRET_KEY = process.env.JWT_SECRET || 'eagle-eye-secret-key';
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a demo user for testing purposes
   */
  static async createDemoUser(): Promise<AuthenticatedUser> {
    try {
      // Check if demo user already exists
      let user = await prisma.user.findUnique({
        where: { email: 'demo@eagle-eye.com' }
      });

      if (!user) {
        // Create demo user
        user = await prisma.user.create({
          data: {
            email: 'demo@eagle-eye.com',
            name: 'Demo User',
            role: 'ANALYST'
          }
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role
      };
    } catch (error) {
      console.error('Failed to create demo user:', error);
      // Return a mock user if database fails
      return {
        id: 'demo-user-id',
        email: 'demo@eagle-eye.com',
        name: 'Demo User',
        role: 'ANALYST'
      };
    }
  }

  /**
   * Generate a simple token for demo purposes
   */
  static generateToken(user: AuthenticatedUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + this.TOKEN_EXPIRY
    };

    // Simple base64 encoding for demo (use proper JWT in production)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify and decode a token
   */
  static verifyToken(token: string): AuthResult {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp < Date.now()) {
        return { success: false, error: 'Token expired' };
      }

      return {
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        }
      };
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  }

  /**
   * Extract token from request headers
   */
  static extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Authenticate a request
   */
  static async authenticateRequest(request: NextRequest): Promise<AuthResult> {
    try {
      const token = this.extractToken(request);
      
      if (!token) {
        // For demo purposes, create a demo user if no token
        const demoUser = await this.createDemoUser();
        return { success: true, user: demoUser };
      }

      return this.verifyToken(token);
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: AuthenticatedUser, requiredRole: 'ADMIN' | 'ANALYST' | 'VIEWER'): boolean {
    const roleHierarchy = {
      'ADMIN': 3,
      'ANALYST': 2,
      'VIEWER': 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Create a new user (admin only)
   */
  static async createUser(email: string, name: string, role: 'ADMIN' | 'ANALYST' | 'VIEWER'): Promise<AuthenticatedUser> {
    const user = await prisma.user.create({
      data: { email, name, role }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      role: user.role
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role
      };
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }
}
