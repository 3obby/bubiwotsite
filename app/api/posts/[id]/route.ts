import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Types for the response data
interface Author {
  id: string;
  alias: string;
}

interface ValueDonation {
  id: string;
  amount: Decimal;
  donor: Author | null;
  createdAt: Date;
}

interface EmojiReaction {
  id: string;
  emoji: string;
  amount: Decimal;
  user: Author;
  createdAt: Date;
}

interface ReplyWithDetails {
  id: string;
  content: string;
  authorId: string;
  author: Author | null;
  donatedValue: Decimal;
  stake: Decimal;
  effectiveValue: Decimal;
  createdAt: Date;
  timeAgo: string;
  _count: {
    valueDonations: number;
    emojiReactions: number;
  };
  valueDonations: ValueDonation[];
  emojiReactions: EmojiReaction[];
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

// Helper function to recursively fetch replies with proper threading
async function fetchRepliesRecursively(postId: string): Promise<ReplyWithDetails[]> {
  const replies = await prisma.reply.findMany({
    where: { postId },
    include: {
      author: {
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
      valueDonations: {
        include: {
          donor: {
            select: {
              id: true,
              alias: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      emojiReactions: {
        include: {
          user: {
            select: {
              id: true,
              alias: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      effectiveValue: 'desc',
    },
  });

  // Add timeAgo to each reply
  return replies.map((reply: typeof replies[0]): ReplyWithDetails => ({
    ...reply,
    timeAgo: getTimeAgo(reply.createdAt),
  }));
}

// GET - Get detailed post data with full thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Get the main post with all related data
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
            valueDonations: true,
            emojiReactions: true,
          },
        },
        valueDonations: {
          include: {
            donor: {
              select: {
                id: true,
                alias: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        emojiReactions: {
          include: {
            user: {
              select: {
                id: true,
                alias: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all replies with full threading
    const replies = await fetchRepliesRecursively(postId);

    // Transform the post data
    const transformedPost = {
      ...post,
      timeAgo: getTimeAgo(post.createdAt),
      replies,
    };

    // Get thread statistics
    const threadStats = {
      totalReplies: replies.length,
      totalValueDonations: post.valueDonations.reduce((sum: number, donation: ValueDonation) => 
        sum + parseFloat(donation.amount.toString()), 0),
      totalEmojiReactions: post.emojiReactions.length,
      uniqueParticipants: new Set([
        post.authorId,
        ...replies.map((r: ReplyWithDetails) => r.authorId),
        ...post.valueDonations.map((d: ValueDonation) => d.donor?.id),
        ...post.emojiReactions.map((r: EmojiReaction) => r.user.id)
      ].filter(Boolean)).size,
    };

    return NextResponse.json({
      post: transformedPost,
      threadStats,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching post details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 