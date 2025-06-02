import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { config } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';

// Constants
const BASE_RATE = config.tokenEconomy.baseRate; // ¤/sec, consistent with other components
const MIN_FUNDING_AMOUNT = config.thresholds.minimumFunding; // Minimum amount to fund an account

// Check if we need to create a new global balance record (limit to once per hour)
async function shouldCreateGlobalBalance(): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const latestBalance = await prisma.globalTokenBalance.findFirst({
    orderBy: { timestamp: 'desc' }
  });
  
  // Create a new record if no records exist or latest is older than 1 hour
  return !latestBalance || latestBalance.timestamp < oneHourAgo;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, secondsElapsed, sessionId } = await req.json();

    // Validate required fields
    if (!userId || !secondsElapsed) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and secondsElapsed are required' },
        { status: 400 }
      );
    }

    // Get the current user and verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate accrued amount
    const accrualAmount = parseFloat((secondsElapsed * BASE_RATE).toFixed(8));
    
    // Ensure minimum funding amount
    if (accrualAmount < MIN_FUNDING_AMOUNT) {
      return NextResponse.json(
        { error: `Insufficient accrued amount. Minimum required: ${MIN_FUNDING_AMOUNT}` },
        { status: 400 }
      );
    }
    
    // Check if we need to create a new global balance record
    const createGlobalBalance = await shouldCreateGlobalBalance();

    // Execute as a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user's credits
      const userBeforeBalance = parseFloat(user.credits.toString());
      const userAfterBalance = userBeforeBalance + accrualAmount;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: userAfterBalance
        }
      });
      
      // Create or update global token balance (only once per hour)
      let globalBalance;
      if (createGlobalBalance) {
        // For create operations, we need to get the latest balance and add to it
        const latestBalance = await tx.globalTokenBalance.findFirst({
          orderBy: { timestamp: 'desc' }
        });
        
        globalBalance = await tx.globalTokenBalance.create({
          data: {
            totalIssued: latestBalance 
              ? latestBalance.totalIssued.plus(accrualAmount) 
              : new Decimal(accrualAmount),
            totalBurned: latestBalance 
              ? latestBalance.totalBurned 
              : new Decimal(0),
            circulating: latestBalance 
              ? latestBalance.circulating.plus(accrualAmount) 
              : new Decimal(accrualAmount)
          }
        });
      } else {
        // Just update the most recent record
        const latestBalance = await tx.globalTokenBalance.findFirst({
          orderBy: { timestamp: 'desc' }
        });
        
        if (latestBalance) {
          globalBalance = await tx.globalTokenBalance.update({
            where: { id: latestBalance.id },
            data: {
              totalIssued: latestBalance.totalIssued.plus(accrualAmount),
              totalBurned: latestBalance.totalBurned,
              circulating: latestBalance.circulating.plus(accrualAmount)
            }
          });
        } else {
          // Fallback if no record exists (should not happen, but just in case)
          globalBalance = await tx.globalTokenBalance.create({
            data: {
              totalIssued: new Decimal(accrualAmount),
              totalBurned: new Decimal(0),
              circulating: new Decimal(accrualAmount)
            }
          });
        }
      }
      
      // Create a single transaction record
      const transactionRecord = await tx.transactionRecord.create({
        data: {
          userId: userId,
          transactionType: 'fund-account',
          amount: accrualAmount,
          balanceBefore: userBeforeBalance,
          balanceAfter: userAfterBalance,
          metadata: {
            secondsElapsed: secondsElapsed,
            sessionId: sessionId || 'unknown-session'
          }
        }
      });

      return {
        user: updatedUser,
        transactionRecord,
        globalBalance
      };
    });

    // Return success response with updated user data
    return NextResponse.json({
      message: 'Account funded successfully',
      credits: result.user.credits,
      accrued: accrualAmount
    });
    
  } catch (error) {
    console.error('Error funding account:', error);
    return NextResponse.json(
      { error: 'Failed to fund account' },
      { status: 500 }
    );
  }
} 