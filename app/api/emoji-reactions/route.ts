import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateEffectiveValue, calculateExpirationTime, recalculatePostValues, cleanupExpiredContent } from '@/lib/timeDecay';

// POST - Add emoji reaction (with micro-tip)
export async function POST(request: NextRequest) {
  try {
    const { 
      emoji, 
      amount, 
      postId, 
      replyId, 
      userId, 
      password, 
      sessionId, 
      isAnonymous = false 
    } = await request.json();

    if (!emoji || emoji.trim().length === 0) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    if (!postId && !replyId) {
      return NextResponse.json({ error: 'Either postId or replyId is required' }, { status: 400 });
    }

    if (postId && replyId) {
      return NextResponse.json({ error: 'Cannot specify both postId and replyId' }, { status: 400 });
    }

    if (!password && !userId && !sessionId) {
      return NextResponse.json({ error: 'Authentication required (password, userId, or sessionId)' }, { status: 400 });
    }

    const tipAmount = Math.max(0, parseFloat(amount) || 0);
    
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
        user = await prisma.user.create({
          data: {
            password: sessionId,
            alias: sessionAlias,
            hasLoggedIn: true,
            credits: 0.000777,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify target exists and get author chain for tip splitting
    let authorId: string | null = null;
    const ancestors: string[] = [];
    
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true, content: true }
      });
      
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      
      authorId = post.authorId;
      // Posts have no ancestors
    } else {
      const reply = await prisma.reply.findUnique({
        where: { id: replyId! },
        include: {
          post: { select: { authorId: true } }
        }
      });
      
      if (!reply) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      }
      
      authorId = reply.authorId;
      
      // Get ancestor chain for tip splitting
      const replyAncestors = await getReplyAncestors(reply.postId);
      ancestors.push(...replyAncestors);
    }

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.emojiReaction.findFirst({
      where: {
        userId: user.id,
        postId: postId || undefined,
        replyId: replyId || undefined,
        emoji: emoji.trim()
      }
    });

    // Calculate costs
    const baseCost = 0.001; // Base cost for first emoji
    const additionalCost = existingReaction ? 0.0005 : 0; // Cheaper for subsequent
    const systemFee = tipAmount * 0.03; // 3% to system
    const totalCost = baseCost + additionalCost + tipAmount + systemFee;

    // Check if user has sufficient credits
    if (parseFloat(user.credits.toString()) < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient credits. Need ¤${totalCost.toFixed(6)}, have ¤${user.credits.toString()}` 
      }, { status: 400 });
    }

    // Calculate tip distribution
    const authorShare = tipAmount * 0.85; // 85% to author
    const ancestorShare = tipAmount * 0.12; // 12% to ancestors (3% already taken by system)
    const ancestorCount = ancestors.length;
    const perAncestorShare = ancestorCount > 0 ? ancestorShare / ancestorCount : 0;

    // Create reaction and distribute tips in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create or update emoji reaction
      let reaction;
      if (existingReaction) {
        // Update existing reaction
        reaction = await tx.emojiReaction.update({
          where: { id: existingReaction.id },
          data: { 
            amount: parseFloat(existingReaction.amount.toString()) + tipAmount 
          }
        });
      } else {
        // Create new reaction
        reaction = await tx.emojiReaction.create({
          data: {
            userId: user.id,
            postId: postId || undefined,
            replyId: replyId || undefined,
            emoji: emoji.trim(),
            amount: tipAmount
          }
        });
      }

      // Update user credits (deduct total cost)
      const newUserCredits = parseFloat(user.credits.toString()) - totalCost;
      await tx.user.update({
        where: { id: user.id },
        data: { credits: newUserCredits }
      });

      // Distribute tips if amount > 0
      if (tipAmount > 0) {
        // Tip to author (85%)
        if (authorId && authorShare > 0) {
          await tx.user.update({
            where: { id: authorId },
            data: { 
              credits: { increment: authorShare }
            }
          });

          // Record transaction for author
          await tx.transactionRecord.create({
            data: {
              userId: authorId,
              transactionType: 'emoji-tip-received',
              amount: authorShare,
              balanceBefore: 0, // We don't have the before balance
              balanceAfter: 0,   // We don't have the after balance
              metadata: {
                reactionId: reaction.id,
                emoji: emoji.trim(),
                tipperUserId: user.id,
                totalTip: tipAmount,
                authorShare,
                isAnonymous
              }
            }
          });
        }

        // Update the target post/reply with the tip amount and recalculate decay
        if (postId) {
          const currentPost = await tx.post.findUnique({
            where: { id: postId },
            select: { 
              stake: true, 
              donatedValue: true, 
              createdAt: true,
              valueDonations: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true }
              }
            }
          });
          
          if (currentPost) {
            const now = new Date();
            const newDonatedValue = parseFloat(currentPost.donatedValue.toString()) + tipAmount;
            const newEffectiveValue = calculateEffectiveValue(
              parseFloat(currentPost.stake.toString()),
              newDonatedValue,
              currentPost.createdAt,
              now
            );
            const newExpiresAt = calculateExpirationTime(
              parseFloat(currentPost.stake.toString()),
              newDonatedValue,
              currentPost.createdAt,
              now
            );
            
            await tx.post.update({
              where: { id: postId },
              data: {
                donatedValue: newDonatedValue,
                totalValue: parseFloat(currentPost.stake.toString()) + newDonatedValue,
                effectiveValue: newEffectiveValue,
                expiresAt: newExpiresAt
              }
            });
          }
        } else if (replyId) {
          const currentReply = await tx.reply.findUnique({
            where: { id: replyId },
            select: { 
              stake: true, 
              donatedValue: true, 
              createdAt: true,
              valueDonations: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true }
              }
            }
          });
          
          if (currentReply) {
            const now = new Date();
            const newDonatedValue = parseFloat(currentReply.donatedValue.toString()) + tipAmount;
            const newEffectiveValue = calculateEffectiveValue(
              parseFloat(currentReply.stake.toString()),
              newDonatedValue,
              currentReply.createdAt,
              now
            );
            const newExpiresAt = calculateExpirationTime(
              parseFloat(currentReply.stake.toString()),
              newDonatedValue,
              currentReply.createdAt,
              now
            );
            
            await tx.reply.update({
              where: { id: replyId },
              data: {
                donatedValue: newDonatedValue,
                effectiveValue: newEffectiveValue,
                expiresAt: newExpiresAt
              }
            });
          }
        }

        // Tip to ancestors (12% split evenly)
        for (const ancestorId of ancestors) {
          if (ancestorId && perAncestorShare > 0) {
            await tx.user.update({
              where: { id: ancestorId },
              data: { 
                credits: { increment: perAncestorShare }
              }
            });

            // Record transaction for ancestor
            await tx.transactionRecord.create({
              data: {
                userId: ancestorId,
                transactionType: 'emoji-tip-ancestor',
                amount: perAncestorShare,
                balanceBefore: 0,
                balanceAfter: 0,
                metadata: {
                  reactionId: reaction.id,
                  emoji: emoji.trim(),
                  tipperUserId: user.id,
                  totalTip: tipAmount,
                  ancestorShare: perAncestorShare,
                  isAnonymous
                }
              }
            });
          }
        }
      }

      // Record burned credits (base cost + system fee)
      const burnedAmount = baseCost + additionalCost + systemFee;
      if (burnedAmount > 0) {
        await tx.burnedCredit.create({
          data: {
            userId: user.id,
            amount: burnedAmount,
            action: 'emoji-reaction',
            balanceBefore: user.credits,
            balanceAfter: newUserCredits
          }
        });
      }

      // Record transaction for tipper
      await tx.transactionRecord.create({
        data: {
          userId: user.id,
          transactionType: 'emoji-reaction',
          amount: -totalCost,
          balanceBefore: user.credits,
          balanceAfter: newUserCredits,
          metadata: {
            reactionId: reaction.id,
            emoji: emoji.trim(),
            tipAmount,
            baseCost,
            additionalCost,
            systemFee,
            totalCost,
            authorShare,
            ancestorShare: perAncestorShare * ancestorCount,
            isAnonymous,
            targetType: postId ? 'post' : 'reply',
            targetId: postId || replyId
          }
        }
      });

      return reaction;
    });

    // Trigger background recalculation for the affected post and cleanup
    try {
      if (postId) {
        await recalculatePostValues(postId);
      } else if (replyId) {
        // For replies, we need to get the post ID first
        const reply = await prisma.reply.findUnique({
          where: { id: replyId },
          select: { postId: true }
        });
        if (reply) {
          await recalculatePostValues(reply.postId);
        }
      }
      const cleanupResult = await cleanupExpiredContent();
      console.log(`Background update after emoji reaction: ${cleanupResult.postsArchived} posts archived`);
    } catch (bgError) {
      console.error('Background recalculation failed (non-critical):', bgError);
      // Don't fail the request if background processing fails
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating emoji reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get reply ancestor chain
async function getReplyAncestors(postId: string): Promise<string[]> {
  const ancestors: string[] = [];
  
  // Get the post author first
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true }
  });
  
  if (post?.authorId) {
    ancestors.push(post.authorId);
  }

  // Could implement more complex ancestor traversal here
  // For now, just include the post author
  
  return ancestors;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  totalAmount: number;
  users: Array<{
    id: string;
    alias: string;
    amount: number;
  }>;
}

interface EmojiReactionWithUser {
  emoji: string;
  amount: { toString: () => string };
  user: {
    id: string;
    alias: string;
  };
}

// GET - Get emoji reactions for a post or reply
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const replyId = searchParams.get('replyId');

    if (!postId && !replyId) {
      return NextResponse.json({ error: 'Either postId or replyId is required' }, { status: 400 });
    }

    const reactions = await prisma.emojiReaction.findMany({
      where: {
        postId: postId || undefined,
        replyId: replyId || undefined
      },
      include: {
        user: {
          select: {
            id: true,
            alias: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: Record<string, GroupedReaction>, reaction: EmojiReactionWithUser) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          totalAmount: 0,
          users: []
        };
      }
      
      acc[reaction.emoji].count += 1;
      acc[reaction.emoji].totalAmount += parseFloat(reaction.amount.toString());
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        alias: reaction.user.alias,
        amount: parseFloat(reaction.amount.toString())
      });
      
      return acc;
    }, {});

    return NextResponse.json({ reactions: Object.values(groupedReactions) });
  } catch (error) {
    console.error('Error fetching emoji reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 