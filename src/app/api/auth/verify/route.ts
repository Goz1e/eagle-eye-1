import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract token from request
    const token = AuthService.extractToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const authResult = AuthService.verifyToken(token);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: authResult.user,
      message: 'Token verified successfully'
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    
    return NextResponse.json(
      { 
        error: 'Token verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
