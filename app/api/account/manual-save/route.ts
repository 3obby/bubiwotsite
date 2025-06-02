import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { config } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';

// Constants
const BASE_RATE = config.tokenEconomy.baseRate; // ¤/sec, consistent with other components
const MANUAL_SAVE_COST = config.costs.actions.manualSave; // Cost for manual save

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
    const { userId, secondsElapsed, sessionId, saveTime } = await req.json();
    const operationLog = [];

    // Start building the log
    operationLog.push(`Manual save requested at ${saveTime}`);
    operationLog.push(`Session ID: ${sessionId}`);
    operationLog.push(`Seconds elapsed: ${secondsElapsed}`);

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

    operationLog.push(`User found: ${user.alias} (${userId})`);
    operationLog.push(`Current credits: ${user.credits.toString()}`);

    // Calculate accrued amount
    const accrualAmount = parseFloat((secondsElapsed * BASE_RATE).toFixed(8));
    operationLog.push(`Accrued value: ${accrualAmount.toFixed(8)} ¤`);
    
    // Ensure minimum funding amount
    if (accrualAmount < MANUAL_SAVE_COST) {
      operationLog.push(`ERROR: Insufficient accrued amount. Required: ${MANUAL_SAVE_COST}, Accrued: ${accrualAmount.toFixed(8)}`);
      return NextResponse.json(
        { 
          error: `Insufficient accrued amount. Minimum required: ${MANUAL_SAVE_COST}`,
          log: operationLog
        },
        { status: 400 }
      );
    }

    // Calculate the net amount (accrued minus cost)
    const netAmount = accrualAmount - MANUAL_SAVE_COST;
    operationLog.push(`Manual save cost: ${MANUAL_SAVE_COST} ¤`);
    operationLog.push(`Net amount to add: ${netAmount.toFixed(8)} ¤`);

    // Check if we need to create a new global balance record
    const createGlobalBalance = await shouldCreateGlobalBalance();
    
    // Execute as a transaction to ensure data integrity
    operationLog.push('Starting database transaction...');
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user's credits
      const userBeforeBalance = parseFloat(user.credits.toString());
      const userAfterBalance = userBeforeBalance + netAmount;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: userAfterBalance
        }
      });
      operationLog.push(`User credits updated: ${userBeforeBalance.toFixed(8)} ¤ → ${userAfterBalance.toFixed(8)} ¤`);
      
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
              ? latestBalance.totalIssued.plus(netAmount) 
              : new Decimal(netAmount),
            totalBurned: latestBalance 
              ? latestBalance.totalBurned.plus(MANUAL_SAVE_COST) 
              : new Decimal(MANUAL_SAVE_COST),
            circulating: latestBalance 
              ? latestBalance.circulating.plus(netAmount) 
              : new Decimal(netAmount)
          }
        });
        operationLog.push(`Created new global balance record (ID: ${globalBalance.id})`);
      } else {
        // Just update the most recent record
        const latestBalance = await tx.globalTokenBalance.findFirst({
          orderBy: { timestamp: 'desc' }
        });
        
        if (latestBalance) {
          globalBalance = await tx.globalTokenBalance.update({
            where: { id: latestBalance.id },
            data: {
              totalIssued: latestBalance.totalIssued.plus(netAmount),
              totalBurned: latestBalance.totalBurned.plus(MANUAL_SAVE_COST),
              circulating: latestBalance.circulating.plus(netAmount)
            }
          });
          operationLog.push(`Updated existing global balance record (ID: ${globalBalance.id})`);
        } else {
          // Fallback if no record exists (should not happen, but just in case)
          globalBalance = await tx.globalTokenBalance.create({
            data: {
              totalIssued: new Decimal(netAmount),
              totalBurned: new Decimal(MANUAL_SAVE_COST),
              circulating: new Decimal(netAmount)
            }
          });
          operationLog.push(`Created fallback global balance record (ID: ${globalBalance.id})`);
        }
      }
      
      // Create a single TransactionRecord that captures both the accrual and burn
      const transactionRecord = await tx.transactionRecord.create({
        data: {
          userId: userId,
          transactionType: 'manual-save', // Combined transaction type
          amount: netAmount, // Net amount after burn
          balanceBefore: userBeforeBalance,
          balanceAfter: userAfterBalance,
          metadata: {
            sessionId: sessionId || 'unknown-session',
            secondsElapsed: secondsElapsed,
            saveTime: saveTime,
            accrued: accrualAmount,
            burned: MANUAL_SAVE_COST,
            net: netAmount
          }
        }
      });
      operationLog.push(`Created transaction record (ID: ${transactionRecord.id})`);
      
      // Create burned credit record for the save cost
      const burnedCredit = await tx.burnedCredit.create({
        data: {
          userId: userId,
          amount: MANUAL_SAVE_COST,
          action: 'manual-save',
          balanceBefore: userBeforeBalance,
          balanceAfter: userAfterBalance,
          globalBalanceId: globalBalance.id
        }
      });
      operationLog.push(`Created burned credit record (ID: ${burnedCredit.id})`);

      return {
        user: updatedUser,
        transactionRecord,
        burnedCredit,
        globalBalance
      };
    });

    operationLog.push('Transaction completed successfully');
    operationLog.push(`Final user credits: ${result.user.credits.toString()} ¤`);

    // Return success response with detailed log
    return NextResponse.json({
      message: 'Account saved successfully',
      credits: result.user.credits,
      accrued: accrualAmount,
      cost: MANUAL_SAVE_COST,
      net: netAmount,
      log: operationLog
    });
    
  } catch (error) {
    console.error('Error saving account:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save account',
        log: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      },
      { status: 500 }
    );
  }
} 