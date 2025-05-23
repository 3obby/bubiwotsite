import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Define transaction record type with user information
interface TransactionWithUser {
  id: string;
  userId: string;
  transactionType: string;
  amount: Decimal;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  metadata: unknown;
  createdAt: Date;
  user: { 
    alias: string 
  };
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Cap at 50 records per page
    const transactionType = url.searchParams.get('type') || undefined;
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get the current user and verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Prepare filter conditions
    const where = {
      userId,
      ...(transactionType ? { transactionType } : {})
    };
    
    // Get transaction records with pagination
    const [transactions, totalCount] = await Promise.all([
      prisma.transactionRecord.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              alias: true
            }
          }
        }
      }),
      prisma.transactionRecord.count({ where })
    ]);
    
    // Get burned credits related to these transactions
    const burnedCredits = await prisma.burnedCredit.findMany({
      where: {
        userId,
        id: {
          in: transactions
            .filter((t: TransactionWithUser) => t.transactionType === 'burn')
            .map((t: TransactionWithUser) => {
              const metadata = t.metadata as Record<string, unknown>;
              return metadata?.burnedCreditId as string;
            })
            .filter(Boolean) as string[]
        }
      }
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    // Return success response with transaction history
    return NextResponse.json({
      transactions: transactions.map((t: TransactionWithUser) => ({
        id: t.id,
        type: t.transactionType,
        amount: t.amount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        metadata: t.metadata,
        createdAt: t.createdAt,
        userAlias: t.user.alias
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      related: {
        burnedCredits
      }
    });
    
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
} 