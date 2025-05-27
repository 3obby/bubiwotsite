import { NextRequest, NextResponse } from 'next/server';
import { prisma, safeDbOperation, checkDatabaseHealth } from '@/lib/prisma';

const WITHDRAWAL_COST = 0.01;
const MINIMUM_WITHDRAWAL = 0.01;

export async function GET(request: NextRequest) {
  // Check database health first
  const healthCheck = await checkDatabaseHealth();
  if (!healthCheck.isHealthy) {
    console.error('Database health check failed:', healthCheck.error);
    return NextResponse.json(
      { 
        error: 'Database temporarily unavailable. Please try again in a moment.',
        details: healthCheck.error,
        retryAfter: 30
      },
      { status: 503 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const password = searchParams.get('password');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const clientAccruedAmount = searchParams.get('accruedAmount');

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 400 });
    }

    // Define user type based on expected Prisma user structure
    type UserData = {
      id: string;
      alias: string;
      password: string;
      credits: { toString(): string }; // Prisma Decimal type
      lastWithdrawAt: Date | null;
      accountActivatedAt: Date;
      lifetimeAllocated?: { toString(): string }; // Prisma Decimal type
      lifetimeCollected?: { toString(): string }; // Prisma Decimal type
      lifetimeCollections?: number;
      hasLoggedIn: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    };

    // Find user by authentication method with retry logic
    let userResult: { success: boolean; data?: UserData | null; error?: string };

    if (password) {
      userResult = await safeDbOperation(() => 
        prisma.user.findFirst({ where: { password } })
      );
    } else if (userId) {
      userResult = await safeDbOperation(() => 
        prisma.user.findUnique({ where: { id: userId } })
      );
    } else if (sessionId) {
      // Try to find user by sessionId as password first (for session-based users)
      userResult = await safeDbOperation(() => 
        prisma.user.findFirst({ where: { password: sessionId } })
      );
      
      // If not found, try the alias-based approach
      if (userResult.success && !userResult.data) {
        const sessionAlias = `user_${sessionId.slice(0, 8)}`;
        userResult = await safeDbOperation(() => 
          prisma.user.findFirst({ where: { alias: sessionAlias } })
        );
        
        // If still not found, create a new user for this session
        if (userResult.success && !userResult.data) {
          userResult = await safeDbOperation(() => 
            prisma.user.create({
              data: {
                password: sessionId, // Use sessionId as password for consistency
                alias: sessionAlias,
                hasLoggedIn: true,
                credits: 0.000777, // Default credits
              },
            })
          );
        }
      }
    } else {
      return NextResponse.json({ error: 'Authentication method required' }, { status: 400 });
    }

    if (!userResult || !userResult.success) {
      console.error('Database operation failed:', userResult?.error);
      return NextResponse.json({ 
        error: 'Database error. Please try again in a moment.',
        details: userResult?.error
      }, { status: 503 });
    }

    const user = userResult.data;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current token rate (with inflation) - with fallback if this fails
    let currentRate = 0.0001; // Default rate
    try {
      const rateResponse = await fetch(`${request.nextUrl.origin}/api/tokens/rate`);
      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        currentRate = rateData.currentRate || 0.0001;
      }
    } catch (error) {
      console.warn('Failed to fetch current rate, using default:', error);
    }

    // Always use server calculation as the authoritative source
    const now = new Date();
    const lastWithdraw = user.lastWithdrawAt || user.accountActivatedAt;
    const secondsElapsed = (now.getTime() - lastWithdraw.getTime()) / 1000;
    const accruedTokens = secondsElapsed * 0.0001; // ¤0.0001 per second (fixed rate)

    // Log client vs server comparison for monitoring (but don't reject)
    if (clientAccruedAmount && !isNaN(parseFloat(clientAccruedAmount))) {
      const clientAmount = parseFloat(clientAccruedAmount);
      const difference = Math.abs(accruedTokens - clientAmount);
      if (difference > 0.001) { // Only log significant differences
        console.log('ℹ️ Balance check - client/server difference (informational):');
        console.log('  Server calculated:', accruedTokens);
        console.log('  Client provided:', clientAmount);
        console.log('  Difference:', difference);
        console.log('  Using server calculation as authoritative');
      }
    }

    // Check if user can withdraw
    const hasMinimumAccrued = accruedTokens >= WITHDRAWAL_COST;
    const totalAvailable = parseFloat(user.credits.toString()) + accruedTokens;
    const hasMinimumBalance = totalAvailable >= WITHDRAWAL_COST;
    const canWithdraw = hasMinimumAccrued && hasMinimumBalance;

    const secondsSinceLastWithdraw = Math.floor(secondsElapsed);

    return NextResponse.json({
      user: {
        id: user.id,
        alias: user.alias,
        credits: parseFloat(user.credits.toString()),
        lastWithdrawAt: user.lastWithdrawAt,
        lifetimeAllocated: parseFloat((user.lifetimeAllocated || 0).toString()),
        lifetimeCollected: parseFloat((user.lifetimeCollected || 0).toString()),
        lifetimeCollections: user.lifetimeCollections || 0,
      },
      accruedTokens: parseFloat(accruedTokens.toFixed(8)),
      currentRate: currentRate,
      canWithdraw: canWithdraw,
      withdrawalCost: WITHDRAWAL_COST,
      minimumWithdrawal: MINIMUM_WITHDRAWAL,
      secondsSinceLastWithdraw: secondsSinceLastWithdraw,
      // Include lifetime metrics in response
      lifetimeMetrics: {
        allocated: parseFloat((user.lifetimeAllocated || 0).toString()),
        collected: parseFloat((user.lifetimeCollected || 0).toString()),
        burned: parseFloat((user.lifetimeAllocated || 0).toString()) - parseFloat((user.lifetimeCollected || 0).toString()),
        collections: user.lifetimeCollections || 0,
        collectionPercentage: parseFloat((user.lifetimeAllocated || 0).toString()) > 0 
          ? (parseFloat((user.lifetimeCollected || 0).toString()) / parseFloat((user.lifetimeAllocated || 0).toString())) * 100 
          : 0,
      },
      databaseHealth: {
        isHealthy: healthCheck.isHealthy,
        latency: healthCheck.latency
      }
    });
  } catch (error) {
    console.error('Error checking token balance:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 