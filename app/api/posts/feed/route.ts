import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Author interface for nested author data
interface Author {
  id: string;
  alias: string;
}

interface PostReply {
  id: string;
  content: string;
  authorId: string;
  author: Author;
  donatedValue: Decimal; // Prisma Decimal
  stake: Decimal; // Prisma Decimal
  effectiveValue: Decimal; // Prisma Decimal
  createdAt: Date;
  _count: {
    valueDonations: number;
    emojiReactions: number;
  };
}

interface PostWithReplies {
  id: string;
  content: string;
  authorId: string | null;
  author: Author | null;
  promotionValue: Decimal; // Prisma Decimal
  donatedValue: Decimal; // Prisma Decimal
  totalValue: Decimal; // Prisma Decimal
  stake: Decimal; // Prisma Decimal
  effectiveValue: Decimal; // Prisma Decimal
  createdAt: Date;
  replies: PostReply[];
  _count: {
    replies: number;
    valueDonations: number;
    emojiReactions: number;
  };
}

// GET - Fetch posts with nested replies for the global feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'effectiveValue'; // effectiveValue, totalValue, createdAt
    
    const skip = (page - 1) * limit;
    
    // Determine sort order
    const orderBy = (() => {
      switch (sortBy) {
        case 'totalValue':
          return { totalValue: 'desc' as const };
        case 'createdAt':
          return { createdAt: 'desc' as const };
        case 'effectiveValue':
        default:
          return { effectiveValue: 'desc' as const };
      }
    })();
    
    // Fetch posts with replies and author information
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
        replies: {
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
          },
          orderBy: {
            effectiveValue: 'desc',
          },
        },
        _count: {
          select: {
            replies: true,
            valueDonations: true,
            emojiReactions: true,
          },
        },
      },
    });
    
    // Get total count for pagination
    const totalPosts = await prisma.post.count();
    const hasMore = skip + limit < totalPosts;

    // Transform data to include calculated fields
    const transformedPosts = posts.map((post: PostWithReplies) => ({
      ...post,
      timeAgo: getTimeAgo(post.createdAt),
      replies: post.replies.map((reply: PostReply) => ({
        ...reply,
        timeAgo: getTimeAgo(reply.createdAt),
      })),
    }));

    return NextResponse.json({
      posts: transformedPosts,
      hasMore,
      page,
      totalPosts,
    });
  } catch (error) {
    console.error('Error fetching posts feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
} 