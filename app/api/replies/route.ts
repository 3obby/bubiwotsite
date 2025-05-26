import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// POST - Create a new reply to a post or another reply
export async function POST(request: NextRequest) {
  try {
    const { content, postId, parentReplyId, password, userId, sessionId, isAnonymous = false } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content exceeds 1000 character limit' }, { status: 400 });
    }

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
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
            credits: 0.000777,
          },
        });
        console.log(`Created new user for session ${sessionId}:`, user);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Verify the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If replying to another reply, verify it exists and belongs to the same post
    if (parentReplyId) {
      const parentReply = await prisma.reply.findUnique({
        where: { id: parentReplyId },
      });

      if (!parentReply || parentReply.postId !== postId) {
        return NextResponse.json({ error: 'Parent reply not found or belongs to different post' }, { status: 404 });
      }
    }

    // Calculate cost: 0.05 per character for replies (cheaper than posts)
    const characterCost = content.length * 0.05;
    const protocolFee = 0; // No promotion value for replies, so no protocol fee
    const totalCost = characterCost + protocolFee;
    const burnedAmount = characterCost + protocolFee; // All gets burned for replies

    console.log('Reply cost calculation:', {
      characterCost,
      protocolFee,
      totalCost,
      burnedAmount,
      userCredits: user.credits.toString()
    });

    // Check if user has sufficient credits
    if (parseFloat(user.credits.toString()) < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${totalCost.toFixed(3)}, have ${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Create reply and update user credits in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the reply
      const reply = await tx.reply.create({
        data: {
          content: content.trim(),
          postId,
          authorId: isAnonymous ? userId : user.id, // Use userId even for anonymous to track spending
          donatedValue: 0,
          stake: 0,
          effectiveValue: 0,
        },
        include: {
          author: isAnonymous ? false : {
            select: {
              id: true,
              alias: true,
            },
          },
          _count: {
            select: {
              valueDonations: true,
              emojiReactions: true,
            },
          },
        },
      });

      // Update user credits
      const newCredits = parseFloat(user.credits.toString()) - totalCost;
      await tx.user.update({
        where: { id: user.id },
        data: { credits: newCredits },
      });

      // Record the credit burn
      await tx.burnedCredit.create({
        data: {
          userId: user.id,
          amount: burnedAmount,
          action: 'reply-creation',
          balanceBefore: user.credits,
          balanceAfter: newCredits,
        },
      });

      // Record the transaction
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'reply',
          amount: -totalCost,
          balanceBefore: user.credits,
          balanceAfter: newCredits,
          metadata: {
            replyId: reply.id,
            postId,
            parentReplyId: parentReplyId || null,
            characterCost,
            protocolFee,
            totalCost,
            burnedAmount,
            isAnonymous,
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
          },
        },
      });

      return reply;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 