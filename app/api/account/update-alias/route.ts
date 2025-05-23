import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Constants
const RENAME_COST = 0.000777; // Cost to change username

export async function POST(req: NextRequest) {
  try {
    const { userId, newAlias } = await req.json();

    // Validate required fields
    if (!userId || !newAlias) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and newAlias are required' },
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

    // Check if user has enough credits
    const userCredits = parseFloat(user.credits.toString());
    if (userCredits < RENAME_COST) {
      return NextResponse.json(
        { error: `Insufficient credits. Required: ${RENAME_COST}, Available: ${userCredits}` },
        { status: 400 }
      );
    }

    // Execute as a transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get or create a global balance record
      const latestBalance = await tx.globalTokenBalance.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      const globalBalance = await tx.globalTokenBalance.create({
        data: {
          totalIssued: latestBalance ? latestBalance.totalIssued : new Decimal(0),
          totalBurned: latestBalance 
            ? latestBalance.totalBurned.plus(RENAME_COST) 
            : new Decimal(RENAME_COST),
          circulating: latestBalance 
            ? latestBalance.circulating.minus(RENAME_COST) 
            : new Decimal(0).minus(RENAME_COST)
        }
      });

      // Update user's credits and alias
      const userBeforeBalance = userCredits;
      const userAfterBalance = userBeforeBalance - RENAME_COST;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          alias: newAlias,
          credits: userAfterBalance
        }
      });
      
      // Create burned credit record
      const burnedCredit = await tx.burnedCredit.create({
        data: {
          userId: userId,
          amount: RENAME_COST,
          action: 'rename',
          balanceBefore: userBeforeBalance,
          balanceAfter: userAfterBalance,
          globalBalanceId: globalBalance.id
        }
      });
      
      // Create transaction record
      const transactionRecord = await tx.transactionRecord.create({
        data: {
          userId: userId,
          transactionType: 'burn',
          amount: RENAME_COST,
          balanceBefore: userBeforeBalance,
          balanceAfter: userAfterBalance,
          metadata: {
            action: 'rename',
            oldAlias: user.alias,
            newAlias: newAlias,
            burnedCreditId: burnedCredit.id
          }
        }
      });

      return {
        user: updatedUser,
        burnedCredit,
        transactionRecord,
        globalBalance
      };
    });

    // Return success response with updated user data
    return NextResponse.json({
      message: 'Alias updated successfully',
      alias: result.user.alias,
      credits: result.user.credits
    });
    
  } catch (error) {
    console.error('Error updating alias:', error);
    return NextResponse.json(
      { error: 'Failed to update alias' },
      { status: 500 }
    );
  }
} 