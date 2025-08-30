import { NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function GET() {
  try {
    // Create a demo user
    const demoUser = await AuthService.createDemoUser();
    
    // Generate a token for the demo user
    const token = AuthService.generateToken(demoUser);

    return NextResponse.json({
      success: true,
      user: demoUser,
      token,
      message: 'Demo user created successfully'
    });

  } catch (error) {
    console.error('Error creating demo user:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create demo user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
