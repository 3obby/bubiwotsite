import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database connection helper with retry logic
export async function connectWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation()
      return result
    } catch (error: unknown) {
      const err = error as Error & { code?: string }
      console.log(`🔄 Database operation attempt ${attempt}/${retries} failed:`, err.code || err.message)
      
      // Check if it's a connection error that might benefit from retry
      const isRetryableError = err.code === 'P1001' || // Can't reach database server
                              err.code === 'P1008' || // Operations timed out
                              err.code === 'P1017' || // Server has closed the connection
                              err.message?.includes('timeout') ||
                              err.message?.includes('ECONNREFUSED') ||
                              err.message?.includes('ECONNRESET')
      
      if (!isRetryableError || attempt === retries) {
        console.error(`❌ Database operation failed after ${attempt} attempts:`, error)
        throw error
      }
      
      // Wait before retrying, with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw new Error('This should never be reached')
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now()
  
  try {
    // Simple query to test connectivity
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime
    
    return {
      isHealthy: true,
      latency
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error('Database health check failed:', error)
    return {
      isHealthy: false,
      error: err.message || 'Unknown database error'
    }
  }
}

// Graceful database operations with fallback
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T,
  retries: number = 2
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await connectWithRetry(operation, retries, 500)
    return { success: true, data }
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    console.error('Safe database operation failed:', error)
    
    const errorMessage = err.code === 'P1001' 
      ? 'Database server temporarily unreachable. Please try again in a moment.'
      : err.message || 'Database operation failed'
    
    return { 
      success: false, 
      error: errorMessage,
      data: fallback 
    }
  }
} 