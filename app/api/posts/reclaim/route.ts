import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateReclaimableStake } from '@/lib/timeDecay';

export async function POST(request: NextRequest) {
  try {
    const { postId, userId, password, sessionId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required (password, userId, or sessionId)' }, { status: 400 });
    }

    // Find user
    let user;
    if (password) {
      user = await prisma.user.findFirst({ where: { password } });
    } else if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    } else if (sessionId) {
      const sessionAlias = `user_${sessionId.slice(0, 8)}`;
      user = await prisma.user.findFirst({ where: { alias: sessionAlias } });
      
      if (!user) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the post and verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        valueDonations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: 'You can only reclaim stake from your own posts' }, { status: 403 });
    }

    // Calculate reclaimable amounts
    const lastDonationAt = post.valueDonations[0]?.createdAt;
    const reclaimData = calculateReclaimableStake(
      parseFloat(post.stake.toString()),
      parseFloat(post.donatedValue.toString()),
      post.createdAt,
      lastDonationAt
    );

    if (reclaimData.totalReclaim <= 0.001) {
      return NextResponse.json({ 
        error: 'No significant stake available to reclaim',
        reclaimableAmount: reclaimData.totalReclaim
      }, { status: 400 });
    }

    // Process reclaim in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user credits (add reclaimed amount)
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { credits: true }
      });

      if (!currentUser) {
        throw new Error('User not found in transaction');
      }

      const newCredits = parseFloat(currentUser.credits.toString()) + reclaimData.totalReclaim;
      await tx.user.update({
        where: { id: user.id },
        data: { credits: newCredits }
      });

      // Update post to reflect reclaimed stake
      const newStake = Math.max(0, parseFloat(post.stake.toString()) - reclaimData.reclaimableStake);
      const newDonatedValue = Math.max(0, parseFloat(post.donatedValue.toString()) - reclaimData.reclaimableDonations);
      const newTotalValue = newStake + newDonatedValue;

      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: {
          stake: newStake,
          donatedValue: newDonatedValue,
          totalValue: newTotalValue,
          effectiveValue: Math.max(0, parseFloat(post.effectiveValue.toString()) - reclaimData.totalReclaim)
        },
        include: {
          author: {
            select: {
              id: true,
              alias: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      // Record the transaction
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'stake-reclaim',
          amount: reclaimData.totalReclaim,
          balanceBefore: currentUser.credits,
          balanceAfter: newCredits,
          metadata: {
            postId,
            reclaimedStake: reclaimData.reclaimableStake,
            reclaimedDonations: reclaimData.reclaimableDonations,
            totalReclaimed: reclaimData.totalReclaim,
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
          },
        },
      });

      return {
        post: updatedPost,
        reclaimedAmount: reclaimData.totalReclaim,
        breakdown: reclaimData,
        newUserCredits: newCredits
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error reclaiming stake:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return NextResponse.json({ error: 'User session expired. Please log in again.' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to reclaim stake. Please try again.' 
    }, { status: 500 });
  }
} 