import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { safeDbOperation, checkDatabaseHealth, connectWithRetry, prisma } from '@/lib/prisma';
import { calculateExpirationTime, recalculateAllEffectiveValues, cleanupExpiredContent } from '@/lib/timeDecay';

// POST - Create a new post
export async function POST(request: NextRequest) {
  // Check database health first
  const healthCheck = await checkDatabaseHealth();
  if (!healthCheck.isHealthy) {
    console.error('Database health check failed:', healthCheck.error);
    return NextResponse.json(
      { 
        error: 'Database temporarily unavailable',
        details: healthCheck.error,
        retryAfter: 30
      },
      { status: 503 }
    );
  }

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

    // Find user with retry logic
    const userResult = await safeDbOperation(async () => {
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
      return user;
    });

    if (!userResult.success) {
      console.error('Failed to find/create user:', userResult.error);
      return NextResponse.json(
        { 
          error: 'Database error during user lookup',
          details: userResult.error
        },
        { status: 500 }
      );
    }

    const user = userResult.data;
    if (!user) {
      return NextResponse.json({ error: 'User not found or could not be created' }, { status: 404 });
    }

    // Calculate total cost: 0.1 per character + promotion value + 3% protocol fee
    const characterCost = content.length * 0.1;
    const protocolFee = promotionValue * 0.03; // 3% protocol fee that gets burned
    const totalCost = characterCost + promotionValue + protocolFee;
    
    // Calculate what gets burned vs what goes to post
    const burnedAmount = characterCost + protocolFee; // Character cost + protocol fee get burned
    const postValue = promotionValue; // Only promotion value goes to post
    
    console.log(`Creating post for user ${user.id}:`);
    console.log(`  - Character cost: ${characterCost} (burned)`);
    console.log(`  - Promotion value: ${promotionValue} (to post)`);
    console.log(`  - Protocol fee (3%): ${protocolFee} (burned)`);
    console.log(`  - Total cost: ${totalCost}`);
    console.log(`  - Total burned: ${burnedAmount}`);

    // Check if user has sufficient credits
    if (parseFloat(user.credits.toString()) < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ${totalCost.toFixed(3)}, have ${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Create post with retry logic
    const transactionResult = await connectWithRetry(async () => {
      console.log(`Creating post transaction for user ${user.id}`);
      
      // Create post and update user credits in a transaction
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Refetch user inside transaction to avoid stale references
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
        });

        if (!currentUser) {
          throw new Error('User not found in transaction');
        }

        // Double-check credits inside transaction
        const currentCredits = parseFloat(currentUser.credits.toString());
        if (currentCredits < totalCost) {
          throw new Error(`Insufficient credits. Need ${totalCost.toFixed(3)}, have ${currentCredits.toFixed(6)}`);
        }

        // Create the post
        const post = await tx.post.create({
          data: {
            content: content.trim(),
            authorId: isAnonymous ? null : user.id, // Set to null if anonymous
            promotionValue: postValue, // Only the promotion value, not including protocol fee
            totalValue: postValue, // Initially just the promotion value (no protocol fee)
            stake: postValue, // Initial stake is the promotion value
            effectiveValue: postValue, // Initial effective value equals stake
            expiresAt: calculateExpirationTime(postValue, 0, new Date()), // Calculate initial expiration
          },
        });

        // Update user credits using current values
        const newCredits = currentCredits - totalCost;
        await tx.user.update({
          where: { id: user.id },
          data: { credits: newCredits },
        });

        // Record the credit burn for only the burned portion (character cost + protocol fee)
        await tx.burnedCredit.create({
          data: {
            userId: user.id,
            amount: burnedAmount, // Only character cost + protocol fee get burned
            action: 'post-creation',
            balanceBefore: currentUser.credits,
            balanceAfter: newCredits,
          },
        });

        // Record the transaction using current values with detailed breakdown
        await tx.transactionRecord.create({
          data: {
            userId: user.id,
            transactionType: 'post',
            amount: -totalCost,
            balanceBefore: currentUser.credits,
            balanceAfter: newCredits,
            metadata: {
              postId: post.id,
              characterCost,
              promotionValue: postValue,
              protocolFee,
              totalCost,
              burnedAmount,
              costBreakdown: {
                characterCost: characterCost,
                promotionValue: postValue,
                protocolFee: protocolFee,
                totalBurned: burnedAmount,
              },
              isAnonymous,
              authMethod: password ? 'password' : userId ? 'userId' : 'sessionId',
              sessionId: sessionId || null,
            },
          },
        });

        // Return simplified post data to avoid complex queries in transaction
        return {
          id: post.id,
          content: post.content,
          authorId: post.authorId,
          promotionValue: post.promotionValue,
          totalValue: post.totalValue,
          createdAt: post.createdAt,
        };
      }, {
        maxWait: 5000, // Maximum time to wait for a transaction slot (5s)
        timeout: 10000, // Maximum time the transaction can run (10s)
      });
    }, 3, 1000);

    console.log(`Transaction successful, fetching complete post data for ${transactionResult.id}`);

    // Fetch the complete post data with retry logic
    const completePostResult = await safeDbOperation(() => 
      prisma.post.findUnique({
        where: { id: transactionResult.id },
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
      })
    );

    if (!completePostResult.success) {
      console.error('Failed to fetch complete post data:', completePostResult.error);
      // Return basic post data if we can't fetch the complete version
      return NextResponse.json(transactionResult);
    }

    console.log(`Post creation completed successfully for ${transactionResult.id}`);
    
    // Trigger background recalculation of all effective values and cleanup
    // This ensures the new post affects the ranking and expired content is cleaned up
    try {
      const recalcResult = await recalculateAllEffectiveValues();
      const cleanupResult = await cleanupExpiredContent();
      console.log(`Background update completed: ${recalcResult.postsUpdated} posts, ${recalcResult.repliesUpdated} replies updated, ${cleanupResult.postsArchived} posts archived`);
    } catch (bgError) {
      console.error('Background recalculation failed (non-critical):', bgError);
      // Don't fail the request if background processing fails
    }
    
    return NextResponse.json(completePostResult.data);

  } catch (error) {
    console.error('Error creating post:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Insufficient credits')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('User not found')) {
        return NextResponse.json({ error: 'User session expired. Please log in again.' }, { status: 401 });
      }
      if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({ 
          error: 'Database temporarily unavailable. Please try again.',
          retryAfter: 30
        }, { status: 503 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create post. Please try again.' 
    }, { status: 500 });
  }
}

// GET - Fetch posts with pagination and sorting
export async function GET(request: NextRequest) {
  // Check database health first
  const healthCheck = await checkDatabaseHealth();
  if (!healthCheck.isHealthy) {
    console.error('Database health check failed:', healthCheck.error);
    return NextResponse.json(
      { 
        error: 'Database temporarily unavailable',
        details: healthCheck.error,
        retryAfter: 30
      },
      { status: 503 }
    );
  }

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

    // Fetch posts with retry logic
    const postsResult = await safeDbOperation(() =>
      prisma.post.findMany({
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
      })
    );

    if (!postsResult.success) {
      console.error('Failed to fetch posts:', postsResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch posts',
          details: postsResult.error
        },
        { status: 500 }
      );
    }

    // Get total count with retry logic
    const countResult = await safeDbOperation(() => prisma.post.count());
    
    if (!countResult.success) {
      console.error('Failed to count posts:', countResult.error);
      // Return posts without total count if count fails
      return NextResponse.json({
        posts: postsResult.data,
        hasMore: false,
        page,
        totalPosts: 0,
        databaseHealth: {
          isHealthy: healthCheck.isHealthy,
          latency: healthCheck.latency
        }
      });
    }

    const totalPosts = (countResult.data as number) || 0;
    const hasMore = skip + limit < totalPosts;

    return NextResponse.json({
      posts: postsResult.data,
      hasMore,
      page,
      totalPosts,
      databaseHealth: {
        isHealthy: healthCheck.isHealthy,
        latency: healthCheck.latency
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 