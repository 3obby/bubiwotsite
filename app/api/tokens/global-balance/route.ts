import { NextResponse } from 'next/server';
import { safeDbOperation, checkDatabaseHealth, prisma } from '@/lib/prisma';

export async function GET() {
  // Check database health first
  const healthCheck = await checkDatabaseHealth();
  if (!healthCheck.isHealthy) {
    console.error('Database health check failed:', healthCheck.error);
    return NextResponse.json(
      { 
        error: 'Database temporarily unavailable',
        details: healthCheck.error,
        retryAfter: 30
      },
      { status: 503 }
    );
  }

  try {
    // Get the most recent global token balance record with retry logic
    const latestBalanceResult = await safeDbOperation(
      () => prisma.globalTokenBalance.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      })
    );

    if (!latestBalanceResult.success) {
      console.error('Failed to fetch latest balance:', latestBalanceResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch token balance data',
          details: latestBalanceResult.error
        },
        { status: 500 }
      );
    }

    // Count users with nonzero token balances with retry logic
    const usersCountResult = await safeDbOperation(
      () => prisma.user.count({
        where: {
          credits: {
            gt: 0
          }
        }
      })
    );

    if (!usersCountResult.success) {
      console.error('Failed to count users with balance:', usersCountResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch user count data',
          details: usersCountResult.error
        },
        { status: 500 }
      );
    }

    const latestBalance = latestBalanceResult.data;
    const usersWithBalance = usersCountResult.data || 0;

    // If no record exists, return default values
    if (!latestBalance) {
      return NextResponse.json({
        totalIssued: 0,
        totalBurned: 0,
        circulating: 0,
        usersWithBalance,
        timestamp: new Date(),
        lastUpdated: new Date(),
        databaseHealth: {
          isHealthy: healthCheck.isHealthy,
          latency: healthCheck.latency
        }
      });
    }

    // Convert Decimal to number for JSON serialization
    // TypeScript assertion: we know latestBalance exists from the check above
    const balance = latestBalance as {
      totalIssued: { toString: () => string };
      totalBurned: { toString: () => string };
      circulating: { toString: () => string };
      timestamp: Date;
    };
    const response = {
      totalIssued: parseFloat(balance.totalIssued.toString()),
      totalBurned: parseFloat(balance.totalBurned.toString()),
      circulating: parseFloat(balance.circulating.toString()),
      usersWithBalance,
      timestamp: balance.timestamp,
      lastUpdated: balance.timestamp,
      databaseHealth: {
        isHealthy: healthCheck.isHealthy,
        latency: healthCheck.latency
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in global balance API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 