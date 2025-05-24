import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    const { content, promotionValue = 0, password, userId, sessionId, isAnonymous = false } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content exceeds 1000 character limit' }, { status: 400 });
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
      // First try to find an existing user with a matching alias based on sessionId
      const sessionAlias = `user_${sessionId.slice(0, 8)}`;
      
      user = await prisma.user.findFirst({
        where: { alias: sessionAlias },
      });

      // If no user found, create one for this session
      if (!user) {
        user = await prisma.user.create({
          data: {
            password: sessionId, // Use sessionId as password for consistency
            alias: sessionAlias,
            hasLoggedIn: true,
            credits: 0.000777, // Default credits
          },
        });
        console.log(`Created new user for session ${sessionId}:`, user);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Calculate total cost: 0.1 per character + promotion value
    const characterCost = content.length * 0.1;
    const totalCost = characterCost + promotionValue;

    // Check if user has sufficient credits
    if (parseFloat(user.credits.toString()) < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${totalCost.toFixed(3)}, have ${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Create post and update user credits in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          content: content.trim(),
          authorId: isAnonymous ? null : user.id, // Set to null if anonymous
          promotionValue,
          totalValue: promotionValue, // Initially just the promotion value
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
              replies: true,
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
          amount: totalCost,
          action: 'post-creation',
          balanceBefore: user.credits,
          balanceAfter: newCredits,
        },
      });

      // Record the transaction
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'post',
          amount: -totalCost,
          balanceBefore: user.credits,
          balanceAfter: newCredits,
          metadata: {
            postId: post.id,
            characterCost,
            promotionValue,
            isAnonymous,
            authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
            sessionId: sessionId || null,
          },
        },
      });

      return post;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch posts with pagination and sorting
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'value';
    
    const skip = (page - 1) * limit;

    // Determine sort order
    const orderBy = sortBy === 'value' 
      ? [{ totalValue: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy,
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

    // Check if there are more posts
    const totalPosts = await prisma.post.count();
    const hasMore = skip + limit < totalPosts;

    return NextResponse.json({
      posts,
      hasMore,
      page,
      totalPosts,
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 