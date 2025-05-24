import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Base rate: ¤0.0001 per second
const BASE_RATE = 0.0001;
// 3% annual inflation rate
const ANNUAL_INFLATION_RATE = 0.03;

export async function GET() {
  try {
    // Get the latest token withdrawal to calculate inflation
    const latestWithdrawal = await prisma.transactionRecord.findFirst({
      where: { transactionType: 'token-withdrawal' },
      orderBy: { createdAt: 'desc' },
    });

    let currentRate = BASE_RATE;
    
    if (latestWithdrawal) {
      // Calculate time since last withdrawal in years
      const timeSinceLastWithdrawal = (Date.now() - latestWithdrawal.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      // Apply compound inflation: rate = base_rate * (1 + inflation_rate)^years
      currentRate = BASE_RATE * Math.pow(1 + ANNUAL_INFLATION_RATE, timeSinceLastWithdrawal);
    }

    return NextResponse.json({
      currentRate: parseFloat(currentRate.toFixed(10)),
      baseRate: BASE_RATE,
      inflationRate: ANNUAL_INFLATION_RATE,
      lastWithdrawalAt: latestWithdrawal?.createdAt || null,
      dailyRate: parseFloat((currentRate * 86400).toFixed(8)),
    });
  } catch (error) {
    console.error('Error getting token rate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 