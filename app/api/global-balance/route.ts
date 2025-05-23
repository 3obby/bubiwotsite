import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Constants for token projections
const TOTAL_PROJECTED_HUMANS = 10_000_000_000; // 10 billion humans
const TOKENS_PER_HUMAN = 1_000_000; // 1 million tokens per human
const TARGET_YEAR = 2035;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS_REMAINING = TARGET_YEAR - CURRENT_YEAR;

export async function GET() {
  try {
    // Get the latest global token balance record
    const latestBalance = await prisma.globalTokenBalance.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // If no record exists, create an initial one
    if (!latestBalance) {
      const initialBalance = await prisma.globalTokenBalance.create({
        data: {
          totalIssued: new Decimal(0),
          totalBurned: new Decimal(0),
          circulating: new Decimal(0)
        }
      });
      
      return NextResponse.json({
        balance: initialBalance,
        projection: {
          totalProjected: TOTAL_PROJECTED_HUMANS * TOKENS_PER_HUMAN,
          tokensPerHuman: TOKENS_PER_HUMAN,
          totalHumans: TOTAL_PROJECTED_HUMANS,
          targetYear: TARGET_YEAR,
          yearsRemaining: YEARS_REMAINING,
          percentComplete: 0
        }
      });
    }

    // Calculate percentage of projected tokens already issued
    const totalProjected = TOTAL_PROJECTED_HUMANS * TOKENS_PER_HUMAN;
    const percentComplete = Number(latestBalance.totalIssued) / totalProjected * 100;

    // Return the latest balance with projection data
    return NextResponse.json({
      balance: latestBalance,
      projection: {
        totalProjected,
        tokensPerHuman: TOKENS_PER_HUMAN,
        totalHumans: TOTAL_PROJECTED_HUMANS,
        targetYear: TARGET_YEAR,
        yearsRemaining: YEARS_REMAINING,
        percentComplete
      }
    });
  } catch (error) {
    console.error("Error fetching global token balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch global token balance" },
      { status: 500 }
    );
  }
}

// Update global token balance (this is for authorized use only)
export async function POST(request: Request) {
  try {
    const { issuedAmount, burnedAmount } = await request.json();
    
    // Validate inputs
    if (issuedAmount === undefined && burnedAmount === undefined) {
      return NextResponse.json(
        { error: "Must provide either issuedAmount or burnedAmount" },
        { status: 400 }
      );
    }
    
    // Get the latest balance
    const latestBalance = await prisma.globalTokenBalance.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    // Calculate new balance values
    let newTotalIssued = latestBalance ? latestBalance.totalIssued : new Decimal(0);
    let newTotalBurned = latestBalance ? latestBalance.totalBurned : new Decimal(0);
    
    if (issuedAmount !== undefined) {
      newTotalIssued = newTotalIssued.plus(new Decimal(issuedAmount));
    }
    
    if (burnedAmount !== undefined) {
      newTotalBurned = newTotalBurned.plus(new Decimal(burnedAmount));
    }
    
    const newCirculating = newTotalIssued.minus(newTotalBurned);
    
    // Create a new balance record
    const newBalance = await prisma.globalTokenBalance.create({
      data: {
        totalIssued: newTotalIssued,
        totalBurned: newTotalBurned,
        circulating: newCirculating
      }
    });
    
    // Calculate percentage of projected tokens already issued
    const totalProjected = TOTAL_PROJECTED_HUMANS * TOKENS_PER_HUMAN;
    const percentComplete = Number(newBalance.totalIssued) / totalProjected * 100;
    
    return NextResponse.json({
      balance: newBalance,
      projection: {
        totalProjected,
        tokensPerHuman: TOKENS_PER_HUMAN,
        totalHumans: TOTAL_PROJECTED_HUMANS,
        targetYear: TARGET_YEAR,
        yearsRemaining: YEARS_REMAINING,
        percentComplete
      }
    });
  } catch (error) {
    console.error("Error updating global token balance:", error);
    return NextResponse.json(
      { error: "Failed to update global token balance" },
      { status: 500 }
    );
  }
} 