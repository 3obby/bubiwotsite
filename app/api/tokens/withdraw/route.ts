import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

// GET - Check accumulated tokens without withdrawing
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const password = searchParams.get('password');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required (password, userId, or sessionId)' }, { status: 400 });
    }

    // Find user by password first, then by userId, then by sessionId
    let user;
    if (password) {
      user = await prisma.user.findFirst({
        where: { password },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (sessionId) {
      const sessionAlias = `user_${sessionId.slice(0, 8)}`;
      user = await prisma.user.findFirst({
        where: { alias: sessionAlias },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate accumulated tokens
    const now = new Date();
    const lastWithdraw = user.lastWithdrawAt || user.accountActivatedAt;
    const secondsElapsed = (now.getTime() - lastWithdraw.getTime()) / 1000;
    
    // Token rate: ¤0.0001 per second
    const tokensEarned = secondsElapsed * config.tokenEconomy.baseRate;
    
    // Transaction cost: ¤0.01
    const transactionCost = config.tokenEconomy.withdrawalCost;
    
    // Net tokens that would be credited
    const netTokens = tokensEarned - transactionCost;
    
    const canWithdraw = netTokens > 0 && parseFloat(user.credits.toString()) >= transactionCost;
    
    return NextResponse.json({
      tokensEarned: parseFloat(tokensEarned.toFixed(8)),
      transactionCost,
      netTokens: parseFloat(netTokens.toFixed(8)),
      secondsElapsed: Math.floor(secondsElapsed),
      canWithdraw,
      currentBalance: parseFloat(user.credits.toString()),
      timeToNextEligible: netTokens <= 0 ? Math.ceil((transactionCost - tokensEarned) / config.tokenEconomy.baseRate) : 0,
      lastWithdrawAt: user.lastWithdrawAt,
      accountActivatedAt: user.accountActivatedAt,
    });
  } catch (error) {
    console.error('Error checking token withdrawal status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password, userId, sessionId } = await request.json();

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required (password, userId, or sessionId)' }, { status: 400 });
    }

    // Find user by password first, then by userId, then by sessionId
    let user;
    if (password) {
      user = await prisma.user.findFirst({
        where: { password },
      });
    } else if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (sessionId) {
      // For session-based auth, find or create a user
      const sessionAlias = `user_${sessionId.slice(0, 8)}`;
      
      user = await prisma.user.findFirst({
        where: { alias: sessionAlias },
      });

      // If no user found, create one for this session
      if (!user) {
        user = await prisma.user.create({
          data: {
            password: sessionId,
            alias: sessionAlias,
            hasLoggedIn: true,
            credits: config.tokenEconomy.defaultCredits,
            accountActivatedAt: new Date(),
          },
        });
        console.log(`Created new user for session ${sessionId}:`, user);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Calculate accumulated tokens
    const now = new Date();
    const lastWithdraw = user.lastWithdrawAt || user.accountActivatedAt;
    const secondsElapsed = (now.getTime() - lastWithdraw.getTime()) / 1000;
    
    // Token rate: ¤0.0001 per second
    const tokensEarned = secondsElapsed * config.tokenEconomy.baseRate;
    
    // Transaction cost: ¤0.01
    const transactionCost = config.tokenEconomy.withdrawalCost;
    
    // Net tokens to credit (earned minus transaction cost)
    const netTokens = tokensEarned - transactionCost;

    if (netTokens <= 0) {
      return NextResponse.json({ 
        error: `Insufficient earnings. Earned ${tokensEarned.toFixed(6)} tokens, need at least ${transactionCost} for transaction cost.`,
        tokensEarned: parseFloat(tokensEarned.toFixed(8)),
        transactionCost,
        secondsElapsed: Math.floor(secondsElapsed),
        timeToNextEligible: Math.ceil((transactionCost - tokensEarned) / config.tokenEconomy.baseRate)
      }, { status: 400 });
    }

    // Check if user has sufficient credits for transaction cost
    if (parseFloat(user.credits.toString()) < transactionCost) {
      return NextResponse.json({ 
        error: `Insufficient credits for transaction cost. Need ${transactionCost}, have ${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Process withdrawal in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user credits and withdrawal time
      const newCredits = parseFloat(user.credits.toString()) + netTokens;
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          credits: newCredits,
          lastWithdrawAt: now,
        },
      });

      // Record the credit burn for transaction cost
      await tx.burnedCredit.create({
        data: {
          userId: user.id,
          amount: transactionCost,
          action: 'token-withdrawal-fee',
          balanceBefore: user.credits,
          balanceAfter: newCredits + transactionCost, // Before adding earned tokens
        },
      });

      // Record the transaction
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'token-withdrawal',
          amount: netTokens,
          balanceBefore: user.credits,
          balanceAfter: newCredits,
          metadata: {
            tokensEarned: parseFloat(tokensEarned.toFixed(8)),
            transactionCost,
            netTokens: parseFloat(netTokens.toFixed(8)),
            secondsElapsed: Math.floor(secondsElapsed),
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
          },
        },
      });

      // Update global token balance
      const latestGlobalBalance = await tx.globalTokenBalance.findFirst({
        orderBy: { timestamp: 'desc' },
      });

      const currentTotalIssued = latestGlobalBalance ? parseFloat(latestGlobalBalance.totalIssued.toString()) : 0;
      const currentTotalBurned = latestGlobalBalance ? parseFloat(latestGlobalBalance.totalBurned.toString()) : 0;

      await tx.globalTokenBalance.create({
        data: {
          totalIssued: currentTotalIssued + tokensEarned, // Add earned tokens to supply
          totalBurned: currentTotalBurned + transactionCost, // Add transaction cost to burned
          circulating: (currentTotalIssued + tokensEarned) - (currentTotalBurned + transactionCost),
          timestamp: now,
        },
      });

      return {
        user: updatedUser,
        tokensEarned: parseFloat(tokensEarned.toFixed(8)),
        transactionCost,
        netTokens: parseFloat(netTokens.toFixed(8)),
        secondsElapsed: Math.floor(secondsElapsed),
        newBalance: parseFloat(newCredits.toFixed(8)),
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error processing token withdrawal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 