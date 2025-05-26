import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Define types for the Prisma query results
type PostWithStats = {
  id: string;
  content: string;
  promotionValue: Decimal;
  donatedValue: Decimal;
  totalValue: Decimal;
  createdAt: Date;
  _count: {
    replies: number;
    valueDonations: number;
    emojiReactions: number;
  };
};

type ReplyWithStats = {
  id: string;
  content: string;
  donatedValue: Decimal;
  createdAt: Date;
  post: {
    id: string;
    content: string;
  };
  _count: {
    valueDonations: number;
    emojiReactions: number;
  };
};

type TransactionWithDecimal = {
  id: string;
  transactionType: string;
  amount: Decimal;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  metadata: unknown;
  createdAt: Date;
};

type BurnedCreditWithDecimal = {
  id: string;
  amount: Decimal;
  action: string;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  createdAt: Date;
};

type DonationGivenWithDecimal = {
  id: string;
  amount: Decimal;
  isAnonymous: boolean;
  createdAt: Date;
  post?: {
    id: string;
    content: string;
    author: {
      alias: string;
    } | null;
  } | null;
  reply?: {
    id: string;
    content: string;
    author: {
      alias: string;
    } | null;
  } | null;
};

type DonationReceivedWithDecimal = {
  id: string;
  amount: Decimal;
  isAnonymous: boolean;
  createdAt: Date;
  donor?: {
    alias: string;
  } | null;
  post?: {
    id: string;
    content: string;
  } | null;
  reply?: {
    id: string;
    content: string;
  } | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        alias: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        hasLoggedIn: true,
        accountActivatedAt: true,
        lastWithdrawAt: true,
        lifetimeAllocated: true,
        lifetimeCollected: true,
        lifetimeCollections: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent posts with stats
    const recentPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        promotionValue: true,
        donatedValue: true,
        totalValue: true,
        createdAt: true,
        _count: {
          select: {
            replies: true,
            valueDonations: true,
            emojiReactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get recent replies with stats
    const recentReplies = await prisma.reply.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        donatedValue: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            content: true
          }
        },
        _count: {
          select: {
            valueDonations: true,
            emojiReactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get recent transactions
    const recentTransactions = await prisma.transactionRecord.findMany({
      where: { userId },
      select: {
        id: true,
        transactionType: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
        metadata: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get burned credits history
    const burnedCredits = await prisma.burnedCredit.findMany({
      where: { userId },
      select: {
        id: true,
        amount: true,
        action: true,
        balanceBefore: true,
        balanceAfter: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get donation statistics
    const donationsGiven = await prisma.valueDonation.findMany({
      where: { donorId: userId },
      select: {
        id: true,
        amount: true,
        isAnonymous: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: { alias: true }
            }
          }
        },
        reply: {
          select: {
            id: true,
            content: true,
            author: {
              select: { alias: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const donationsReceived = await prisma.valueDonation.findMany({
      where: {
        OR: [
          { post: { authorId: userId } },
          { reply: { authorId: userId } }
        ]
      },
      select: {
        id: true,
        amount: true,
        isAnonymous: true,
        createdAt: true,
        donor: {
          select: { alias: true }
        },
        post: {
          select: {
            id: true,
            content: true
          }
        },
        reply: {
          select: {
            id: true,
            content: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate summary statistics
    const totalBurnedCredits = await prisma.burnedCredit.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true
    });

    const totalDonationsGiven = await prisma.valueDonation.aggregate({
      where: { donorId: userId },
      _sum: { amount: true },
      _count: true
    });

    const totalDonationsReceived = await prisma.valueDonation.aggregate({
      where: {
        OR: [
          { post: { authorId: userId } },
          { reply: { authorId: userId } }
        ]
      },
      _sum: { amount: true },
      _count: true
    });

    const postStats = await prisma.post.aggregate({
      where: { authorId: userId },
      _count: true,
      _sum: {
        promotionValue: true,
        donatedValue: true,
        totalValue: true
      }
    });

    const replyStats = await prisma.reply.aggregate({
      where: { authorId: userId },
      _count: true,
      _sum: {
        donatedValue: true
      }
    });

    // Convert Decimal values to numbers
    const profile = {
      user: {
        id: user.id,
        alias: user.alias,
        credits: parseFloat(user.credits.toString()),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hasLoggedIn: user.hasLoggedIn,
        accountActivatedAt: user.accountActivatedAt,
        lastWithdrawAt: user.lastWithdrawAt,
        lifetimeAllocated: parseFloat(user.lifetimeAllocated.toString()),
        lifetimeCollected: parseFloat(user.lifetimeCollected.toString()),
        lifetimeCollections: user.lifetimeCollections
      },
      recentPosts: recentPosts.map((post: PostWithStats) => ({
        ...post,
        promotionValue: parseFloat(post.promotionValue.toString()),
        donatedValue: parseFloat(post.donatedValue.toString()),
        totalValue: parseFloat(post.totalValue.toString())
      })),
      recentReplies: recentReplies.map((reply: ReplyWithStats) => ({
        ...reply,
        donatedValue: parseFloat(reply.donatedValue.toString())
      })),
      recentTransactions: recentTransactions.map((transaction: TransactionWithDecimal) => ({
        ...transaction,
        amount: parseFloat(transaction.amount.toString()),
        balanceBefore: parseFloat(transaction.balanceBefore.toString()),
        balanceAfter: parseFloat(transaction.balanceAfter.toString())
      })),
      burnedCredits: burnedCredits.map((burned: BurnedCreditWithDecimal) => ({
        ...burned,
        amount: parseFloat(burned.amount.toString()),
        balanceBefore: parseFloat(burned.balanceBefore.toString()),
        balanceAfter: parseFloat(burned.balanceAfter.toString())
      })),
      donationsGiven: donationsGiven.map((donation: DonationGivenWithDecimal) => ({
        ...donation,
        amount: parseFloat(donation.amount.toString())
      })),
      donationsReceived: donationsReceived.map((donation: DonationReceivedWithDecimal) => ({
        ...donation,
        amount: parseFloat(donation.amount.toString())
      })),
      statistics: {
        totalBurnedCredits: parseFloat(totalBurnedCredits._sum?.amount?.toString() || '0'),
        burnedCreditsCount: totalBurnedCredits._count,
        totalDonationsGiven: parseFloat(totalDonationsGiven._sum?.amount?.toString() || '0'),
        donationsGivenCount: totalDonationsGiven._count,
        totalDonationsReceived: parseFloat(totalDonationsReceived._sum?.amount?.toString() || '0'),
        donationsReceivedCount: totalDonationsReceived._count,
        postCount: postStats._count,
        totalPostValue: parseFloat(postStats._sum?.totalValue?.toString() || '0'),
        totalPostPromotions: parseFloat(postStats._sum?.promotionValue?.toString() || '0'),
        replyCount: replyStats._count,
        totalReplyValue: parseFloat(replyStats._sum?.donatedValue?.toString() || '0'),
        netWorth: parseFloat(user.credits.toString()) + 
                  parseFloat(totalDonationsReceived._sum?.amount?.toString() || '0') - 
                  parseFloat(totalBurnedCredits._sum?.amount?.toString() || '0'),
        activityScore: postStats._count + replyStats._count + totalDonationsGiven._count
      }
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 