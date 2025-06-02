import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateEffectiveValue, calculateExpirationTime, recalculatePostValues, cleanupExpiredContent } from '@/lib/timeDecay';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { postId, amount, isAnonymous = false, password, userId, sessionId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid donation amount is required' }, { status: 400 });
    }

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
          },
        });
        console.log(`Created new user for session ${sessionId}:`, user);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has sufficient credits
    if (parseFloat(user.credits.toString()) < amount) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${amount}, have ${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Process donation in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update user credits
      const newCredits = parseFloat(user.credits.toString()) - amount;
      await tx.user.update({
        where: { id: user.id },
        data: { credits: newCredits },
      });

      // Update post total value
      const newTotalValue = parseFloat(post.totalValue.toString()) + amount;
      const newDonatedValue = parseFloat(post.donatedValue.toString()) + amount;
      
      // Calculate new effective value and expiration with the donation
      const now = new Date();
      const newEffectiveValue = calculateEffectiveValue(
        parseFloat(post.stake.toString()),
        newDonatedValue,
        post.createdAt,
        now
      );
      const newExpiresAt = calculateExpirationTime(
        parseFloat(post.stake.toString()),
        newDonatedValue,
        post.createdAt,
        now
      );
      
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { 
          totalValue: newTotalValue,
          donatedValue: newDonatedValue,
          effectiveValue: newEffectiveValue,
          expiresAt: newExpiresAt
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

      // Create donation record
      await tx.valueDonation.create({
        data: {
          postId,
          donorId: isAnonymous ? null : user.id,
          amount,
          isAnonymous,
        },
      });

      // Record the transaction
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'donation',
          amount: -amount,
          balanceBefore: user.credits,
          balanceAfter: newCredits,
          metadata: {
            postId,
            isAnonymous,
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
          },
        },
      });

      return updatedPost;
    });

    // Trigger background recalculation for this post and cleanup
    try {
      await recalculatePostValues(postId);
      const cleanupResult = await cleanupExpiredContent();
      console.log(`Background update after donation: post ${postId} updated, ${cleanupResult.postsArchived} posts archived`);
    } catch (bgError) {
      console.error('Background recalculation failed (non-critical):', bgError);
      // Don't fail the request if background processing fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing donation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 