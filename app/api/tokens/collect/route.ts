import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

const WITHDRAWAL_COST = config.tokenEconomy.withdrawalCost;

export async function POST(request: NextRequest) {
  try {
    const { password, userId, sessionId, confirmedAccruedAmount } = await request.json();

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 400 });
    }

    // confirmedAccruedAmount is optional now - we'll use server calculation as authoritative
    // This eliminates the "accrual calculation mismatch" error

    // Find user by authentication method
    let user;
    if (password) {
      user = await prisma.user.findFirst({ where: { password } });
    } else if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (sessionId) {
      // Try to find user by sessionId as password first (for session-based users)
      user = await prisma.user.findFirst({ where: { password: sessionId } });
      
      // If not found, try the alias-based approach
      if (!user) {
        const sessionAlias = `user_${sessionId.slice(0, 8)}`;
        user = await prisma.user.findFirst({ where: { alias: sessionAlias } });
        
        // Create user if not found for session-based auth
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
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Get current token rate (with inflation)
    const rateResponse = await fetch(`${request.nextUrl.origin}/api/tokens/rate`);
    const { currentRate } = await rateResponse.json();

    // Calculate accrued tokens based on database timestamps - this is the authoritative calculation
    const now = new Date();
    const lastWithdraw = user.lastWithdrawAt || user.accountActivatedAt;
    const timeSinceLastWithdraw = now.getTime() - lastWithdraw.getTime();
    const secondsSinceLastWithdraw = timeSinceLastWithdraw / 1000;
    const serverCalculatedAccrued = secondsSinceLastWithdraw * config.tokenEconomy.baseRate; // ¤0.0001 per second
    
    console.log('⏰ Server-side accrual calculation:');
    console.log('  📅 Last withdraw time:', lastWithdraw);
    console.log('  🕐 Current time:', now);
    console.log('  ⏱️ Seconds since last withdraw:', secondsSinceLastWithdraw);
    console.log('  💰 Server calculated accrued:', serverCalculatedAccrued);
    if (confirmedAccruedAmount) {
      console.log('  📝 Client submitted amount:', confirmedAccruedAmount, '(for reference only)');
    }
    
    // Use server calculation as the authoritative source
    const accruedTokens = serverCalculatedAccrued;
    
    // Log discrepancy for monitoring, but don't reject the transaction
    if (confirmedAccruedAmount && typeof confirmedAccruedAmount === 'number') {
      const calculationDifference = Math.abs(accruedTokens - confirmedAccruedAmount);
      if (calculationDifference > 0.001) { // Only log significant differences
        console.log('ℹ️ Client/server calculation difference (informational):');
        console.log('  Server calculated:', accruedTokens);
        console.log('  Client submitted:', confirmedAccruedAmount);
        console.log('  Difference:', calculationDifference);
        console.log('  Using server calculation as authoritative source');
      }
    }

    // Light validation - ensure the amount is reasonable (not negative or impossibly large)
    if (accruedTokens < 0 || accruedTokens > 100) { // 100 tokens as a sanity check upper limit
      return NextResponse.json({ 
        error: 'Invalid accrued amount',
        calculatedAmount: accruedTokens,
        lastWithdrawAt: lastWithdraw,
        secondsSinceLastWithdraw: secondsSinceLastWithdraw
      }, { status: 400 });
    }

    // Check minimum requirements
    if (accruedTokens < WITHDRAWAL_COST) {
      return NextResponse.json({ 
        error: `Insufficient accrued tokens. Need ${WITHDRAWAL_COST}, have ${accruedTokens.toFixed(8)}`,
        accruedTokens: parseFloat(accruedTokens.toFixed(8)),
        withdrawalCost: WITHDRAWAL_COST
      }, { status: 400 });
    }

    // Check if total available amount covers withdrawal cost
    const totalAvailable = parseFloat(user.credits.toString()) + accruedTokens;
    if (totalAvailable < WITHDRAWAL_COST) {
      return NextResponse.json({ 
        error: `Insufficient total balance for withdrawal cost. Need ${WITHDRAWAL_COST}, have ${totalAvailable.toFixed(8)}`,
        currentBalance: parseFloat(user.credits.toString()),
        accruedTokens: parseFloat(accruedTokens.toFixed(8)),
        totalAvailable: parseFloat(totalAvailable.toFixed(8)),
        withdrawalCost: WITHDRAWAL_COST
      }, { status: 400 });
    }

    // Process the token collection
    const netTokens = accruedTokens - WITHDRAWAL_COST;
    
    console.log('💰 Processing token collection:');
    console.log('  📊 Accrued tokens:', accruedTokens);
    console.log('  💸 Withdrawal cost:', WITHDRAWAL_COST);
    console.log('  📈 Net tokens to add:', netTokens);
    console.log('  🏦 Current user balance:', parseFloat(user.credits.toString()));
    
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user balance and withdrawal time
      const newBalance = parseFloat(user.credits.toString()) + netTokens;
      console.log('  💳 Calculated new balance:', newBalance);
      
      // Calculate lifetime metrics updates
      const currentLifetimeAllocated = parseFloat((user.lifetimeAllocated || 0).toString());
      const currentLifetimeCollected = parseFloat((user.lifetimeCollected || 0).toString());
      const currentLifetimeCollections = user.lifetimeCollections || 0;
      
      const newLifetimeAllocated = currentLifetimeAllocated + accruedTokens;
      const newLifetimeCollected = currentLifetimeCollected + netTokens; // Only net tokens (after fee)
      const newLifetimeCollections = currentLifetimeCollections + 1;
      
      console.log('  📊 Lifetime metrics update:');
      console.log('    🏆 Lifetime allocated: ', currentLifetimeAllocated, '->', newLifetimeAllocated, '(+', accruedTokens, ')');
      console.log('    💰 Lifetime collected: ', currentLifetimeCollected, '->', newLifetimeCollected, '(+', netTokens, ')');
      console.log('    🔢 Lifetime collections:', currentLifetimeCollections, '->', newLifetimeCollections);
      
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { 
          credits: newBalance,
          lastWithdrawAt: new Date(),
          lifetimeAllocated: newLifetimeAllocated,
          lifetimeCollected: newLifetimeCollected,
          lifetimeCollections: newLifetimeCollections,
        },
      });
      console.log('  ✅ User updated in database, new credits:', parseFloat(updatedUser.credits.toString()));

      // Record the withdrawal cost as burned credit
      await tx.burnedCredit.create({
        data: {
          userId: user.id,
          amount: WITHDRAWAL_COST,
          action: 'token-collection-fee',
          balanceBefore: user.credits,
          balanceAfter: newBalance + WITHDRAWAL_COST, // Before adding net tokens
        },
      });
      console.log('  🔥 Burned credit recorded:', WITHDRAWAL_COST);

      // Record the transaction
      const transaction = await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'token-collection',
          amount: netTokens,
          balanceBefore: user.credits,
          balanceAfter: newBalance,
          metadata: {
            accruedTokens: parseFloat(accruedTokens.toFixed(8)),
            withdrawalCost: WITHDRAWAL_COST,
            netTokens: parseFloat(netTokens.toFixed(8)),
            currentRate: currentRate,
            secondsElapsed: secondsSinceLastWithdraw,
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
            serverCalculatedAccrued: parseFloat(serverCalculatedAccrued.toFixed(8)),
            clientSubmittedAmount: confirmedAccruedAmount || null,
            lastWithdrawAt: lastWithdraw,
            // Include lifetime metrics in transaction metadata
            lifetimeMetrics: {
              allocatedBefore: currentLifetimeAllocated,
              allocatedAfter: newLifetimeAllocated,
              collectedBefore: currentLifetimeCollected,
              collectedAfter: newLifetimeCollected,
              collectionsBefore: currentLifetimeCollections,
              collectionsAfter: newLifetimeCollections,
            },
          },
        },
      });
      console.log('  📝 Transaction recorded:', transaction.id);

      // Update global token balance
      const latestGlobalBalance = await tx.globalTokenBalance.findFirst({
        orderBy: { timestamp: 'desc' },
      });

      const currentTotalIssued = latestGlobalBalance ? parseFloat(latestGlobalBalance.totalIssued.toString()) : 0;
      const currentTotalBurned = latestGlobalBalance ? parseFloat(latestGlobalBalance.totalBurned.toString()) : 0;

      await tx.globalTokenBalance.create({
        data: {
          totalIssued: currentTotalIssued + accruedTokens,
          totalBurned: currentTotalBurned + WITHDRAWAL_COST,
          circulating: (currentTotalIssued + accruedTokens) - (currentTotalBurned + WITHDRAWAL_COST),
          timestamp: new Date(),
        },
      });
      console.log('  🌍 Global balance updated');

      // Ensure proper number conversion for response
      const finalBalance = parseFloat(updatedUser.credits.toString());
      const finalNetTokens = parseFloat(netTokens.toFixed(8));
      const finalAccruedTokens = parseFloat(accruedTokens.toFixed(8));

      const finalResult = {
        user: {
          ...updatedUser,
          credits: finalBalance, // Ensure it's a number, not Decimal
          lifetimeAllocated: parseFloat((updatedUser.lifetimeAllocated || 0).toString()),
          lifetimeCollected: parseFloat((updatedUser.lifetimeCollected || 0).toString()),
          lifetimeCollections: updatedUser.lifetimeCollections || 0,
        },
        transaction,
        accruedTokens: finalAccruedTokens,
        withdrawalCost: WITHDRAWAL_COST,
        netTokens: finalNetTokens,
        newBalance: finalBalance,
        currentRate: currentRate,
        // Include lifetime metrics in response
        lifetimeMetrics: {
          allocated: parseFloat((updatedUser.lifetimeAllocated || 0).toString()),
          collected: parseFloat((updatedUser.lifetimeCollected || 0).toString()),
          collections: updatedUser.lifetimeCollections || 0,
          collectionPercentage: parseFloat((updatedUser.lifetimeAllocated || 0).toString()) > 0 
            ? (parseFloat((updatedUser.lifetimeCollected || 0).toString()) / parseFloat((updatedUser.lifetimeAllocated || 0).toString())) * 100 
            : 0,
        },
      };
      
      console.log('  🎯 Final result being returned:', {
        newBalance: finalResult.newBalance,
        netTokens: finalResult.netTokens,
        dbBalance: finalBalance,
        lifetimeMetrics: finalResult.lifetimeMetrics,
        type: typeof finalResult.newBalance
      });

      return finalResult;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 30000, // 30 seconds
    });

    console.log('🎉 Token collection transaction completed successfully');
    console.log('📤 Returning to client:', {
      success: true,
      newBalance: result.newBalance,
      netTokens: result.netTokens
    });

    // Critical: Wait for database to fully commit before verification
    console.log('⏳ Waiting for database commit...');
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

    // Verify the database update actually persisted
    console.log('🔍 Verifying database update persistence...');
    try {
      const verificationUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true, lastWithdrawAt: true, updatedAt: true }
      });
      
      if (verificationUser) {
        const verifiedBalance = parseFloat(verificationUser.credits.toString());
        console.log('✅ Database verification successful:');
        console.log('  💰 Expected balance:', result.newBalance);
        console.log('  🏦 Actual database balance:', verifiedBalance);
        console.log('  📅 Last withdraw time:', verificationUser.lastWithdrawAt);
        console.log('  🕐 Record updated at:', verificationUser.updatedAt);
        
        if (Math.abs(verifiedBalance - result.newBalance) > 0.00000001) {
          console.error('❌ CRITICAL: Database balance mismatch!');
          console.error('  Expected:', result.newBalance);
          console.error('  Actual:', verifiedBalance);
          console.error('  Difference:', verifiedBalance - result.newBalance);
          
          // Return the actual database value to client
          return NextResponse.json({
            success: true,
            message: 'Tokens collected successfully (balance corrected)',
            ...result,
            newBalance: verifiedBalance, // Use the actual database value
            balanceDiscrepancy: {
              expected: result.newBalance,
              actual: verifiedBalance,
              difference: verifiedBalance - result.newBalance
            }
          });
        } else {
          console.log('✅ Balance verification passed - transaction persisted correctly');
        }
      } else {
        console.error('❌ CRITICAL: User not found during verification!');
      }
    } catch (verificationError) {
      console.error('❌ Database verification failed:', verificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens collected successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error collecting tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 