import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

type UserWithCounts = {
  id: string;
  alias: string;
  credits: Decimal;
  createdAt: Date;
  updatedAt: Date;
  hasLoggedIn: boolean;
  lifetimeAllocated: Decimal;
  lifetimeCollected: Decimal;
  lifetimeCollections: number;
  _count: {
    posts: number;
    replies: number;
    valueDonations: number;
    burnedCredits: number;
    transactions: number;
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause for search
    const whereClause = search ? {
      alias: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : {};

    // Get users with aggregated stats
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        alias: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        hasLoggedIn: true,
        lifetimeAllocated: true,
        lifetimeCollected: true,
        lifetimeCollections: true,
        _count: {
          select: {
            posts: true,
            replies: true,
            valueDonations: true,
            burnedCredits: true,
            transactions: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    });

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user: UserWithCounts) => {
        // Get total burned credits
        const totalBurned = await prisma.burnedCredit.aggregate({
          where: { userId: user.id },
          _sum: { amount: true }
        });

        // Get total donations given
        const donationsGiven = await prisma.valueDonation.aggregate({
          where: { donorId: user.id },
          _sum: { amount: true }
        });

        // Get total donations received (for their posts/replies)
        const donationsReceived = await prisma.valueDonation.aggregate({
          where: {
            OR: [
              { post: { authorId: user.id } },
              { reply: { authorId: user.id } }
            ]
          },
          _sum: { amount: true }
        });

        return {
          id: user.id,
          alias: user.alias,
          credits: parseFloat(user.credits.toString()),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          hasLoggedIn: user.hasLoggedIn,
          lifetimeAllocated: parseFloat(user.lifetimeAllocated.toString()),
          lifetimeCollected: parseFloat(user.lifetimeCollected.toString()),
          lifetimeCollections: user.lifetimeCollections,
          stats: {
            postCount: user._count.posts,
            replyCount: user._count.replies,
            donationCount: user._count.valueDonations,
            burnedCredits: parseFloat(totalBurned._sum?.amount?.toString() || '0'),
            donationsGiven: parseFloat(donationsGiven._sum?.amount?.toString() || '0'),
            donationsReceived: parseFloat(donationsReceived._sum?.amount?.toString() || '0'),
            transactionCount: user._count.transactions,
            totalActivity: user._count.posts + user._count.replies + user._count.valueDonations
          }
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Directory API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user directory' },
      { status: 500 }
    );
  }
} 