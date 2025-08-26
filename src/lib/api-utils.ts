import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const walletEventsSchema = z.object({
  walletAddresses: z.array(z.string().min(1)).min(1).max(100),
  tokenTypes: z.array(z.string().min(1)).min(1).max(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  limit: z.number().min(1).max(1000).optional().default(100),
});

export const walletTransactionsSchema = z.object({
  walletAddresses: z.array(z.string().min(1)).min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const walletBalanceSchema = z.object({
  walletAddresses: z.array(z.string().min(1)).min(1).max(100),
  tokenTypes: z.array(z.string().min(1)).min(1).max(50).optional(),
  includeHistory: z.boolean().optional().default(false),
});

export const pricesSchema = z.object({
  tokens: z.array(z.string().min(1)).min(1).max(100).optional(),
});

export const reportSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  walletAddresses: z.array(z.string().min(1)).min(1).max(100),
  tokenTypes: z.array(z.string().min(1)).min(1).max(50),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['pdf', 'csv', 'json']).optional().default('pdf'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  details?: unknown;
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
}

export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: code || 'ERROR',
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (start >= end) {
    throw new ValidationError('Start date must be before end date');
  }
  
  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
  if (end.getTime() - start.getTime() > maxRange) {
    throw new ValidationError('Date range cannot exceed 1 year');
  }
}

export function calculateProcessingTime(startTime: number): number {
  return Date.now() - startTime;
}

// ============================================================================
// CORS HEADERS
// ============================================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
    ? '*' 
    : process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// ============================================================================
// MIDDLEWARE HELPERS
// ============================================================================

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
) {
  const rateLimiter = new RateLimiter(config);
  
  return async (request: NextRequest) => {
    const clientIP = getClientIP(request);
    
    if (!rateLimiter.isAllowed(clientIP)) {
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    return handler(request);
  };
}

export function withValidation<T>(
  handler: (request: NextRequest, data: T) => Promise<NextResponse>,
  schema: z.ZodSchema<T>
) {
  return async (request: NextRequest) => {
    try {
      let data: T;
      
      if (request.method === 'GET') {
        const url = new URL(request.url);
        data = schema.parse(Object.fromEntries(url.searchParams));
      } else {
        const body = await request.json();
        data = schema.parse(body);
      }
      
      return handler(request, data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          error.issues
        );
      }
      throw error;
    }
  };
}

export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ============================================================================
// LOGGING
// ============================================================================

export function logApiRequest(
  request: NextRequest,
  requestId: string,
  data?: unknown
): void {
  console.log(`[${requestId}] API Request:`, {
    method: request.method,
    url: request.url,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent'),
    data,
    timestamp: new Date().toISOString(),
  });
}

export function logApiResponse(
  requestId: string,
  statusCode: number,
  processingTime: number,
  data?: unknown
): void {
  console.log(`[${requestId}] API Response:`, {
    statusCode,
    processingTime: `${processingTime}ms`,
    dataSize: data ? JSON.stringify(data).length : 0,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// COMPRESSION UTILITIES
// ============================================================================

export function shouldCompressResponse(data: unknown, threshold: number = 1024): boolean {
  const dataSize = JSON.stringify(data).length;
  return dataSize > threshold;
}

export function compressResponse(data: unknown): string {
  // Simple compression for development
  // In production, you might want to use gzip or other compression
  return JSON.stringify(data, null, 0);
}
