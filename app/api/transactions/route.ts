import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Type definitions for transaction data
type TransactionData = {
  id: string;
  transactionType: string;
  amount: Decimal;
  balanceBefore: Decimal;
  balanceAfter: Decimal;
  createdAt: Date;
  metadata: unknown;
};

type TransactionTypeData = {
  transactionType: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // Filter by transaction type
    const export_format = searchParams.get('export'); // 'csv' for export
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Build where clause for filtering
    const whereClause: { userId: string; transactionType?: string } = { userId };
    if (type && type !== 'all') {
      whereClause.transactionType = type;
    }

    // For CSV export, get all records without pagination
    if (export_format === 'csv') {
      const transactions = await prisma.transactionRecord.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionType: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          createdAt: true,
          metadata: true,
        },
      });

      // Convert to CSV format
      const csvHeaders = 'Date,Type,Amount,Balance Before,Balance After,Details\n';
      const csvRows = transactions.map((tx: TransactionData) => {
        const date = tx.createdAt.toISOString();
        const details = tx.metadata ? JSON.stringify(tx.metadata).replace(/"/g, '""') : '';
        return `"${date}","${tx.transactionType}","${tx.amount}","${tx.balanceBefore}","${tx.balanceAfter}","${details}"`;
      }).join('\n');
      
      const csvContent = csvHeaders + csvRows;
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${userId}-${Date.now()}.csv"`,
        },
      });
    }

    // Regular paginated query
    const skip = (page - 1) * limit;
    
    const [transactions, totalCount] = await Promise.all([
      prisma.transactionRecord.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          transactionType: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.transactionRecord.count({ where: whereClause }),
    ]);

    // Get unique transaction types for filter dropdown
    const transactionTypes = await prisma.transactionRecord.findMany({
      where: { userId },
      select: { transactionType: true },
      distinct: ['transactionType'],
      orderBy: { transactionType: 'asc' },
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      transactionTypes: transactionTypes.map((t: TransactionTypeData) => t.transactionType),
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
} 