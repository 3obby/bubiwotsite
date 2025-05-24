import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the most recent global token balance record
    const latestBalance = await prisma.globalTokenBalance.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Count users with nonzero token balances
    const usersWithBalance = await prisma.user.count({
      where: {
        credits: {
          gt: 0
        }
      }
    });

    // If no record exists, return default values
    if (!latestBalance) {
      return NextResponse.json({
        totalIssued: 0,
        totalBurned: 0,
        circulating: 0,
        usersWithBalance,
        timestamp: new Date(),
        lastUpdated: new Date()
      });
    }

    // Convert Decimal to number for JSON serialization
    const response = {
      totalIssued: parseFloat(latestBalance.totalIssued.toString()),
      totalBurned: parseFloat(latestBalance.totalBurned.toString()),
      circulating: parseFloat(latestBalance.circulating.toString()),
      usersWithBalance,
      timestamp: latestBalance.timestamp,
      lastUpdated: latestBalance.timestamp
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching global token balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global token balance' },
      { status: 500 }
    );
  }
} 