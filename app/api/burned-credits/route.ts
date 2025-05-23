import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET() {
  try {
    // Get total burned credits
    let totalBurned: { _sum: { amount: Decimal | null } } = { _sum: { amount: null } };
    let burnedByActionFormatted: { action: string, amount: number }[] = [];
    
    try {
      // Try to get data, but handle case where table doesn't exist yet
      totalBurned = await prisma.burnedCredit.aggregate({
        _sum: {
          amount: true
        }
      });
      
      // Get burned credits by action
      const burnedByAction = await prisma.burnedCredit.groupBy({
        by: ['action'],
        _sum: {
          amount: true
        }
      });
      
      // Format the response
      burnedByActionFormatted = burnedByAction.map((item: { action: string; _sum: { amount: Decimal | null } }) => ({
        action: item.action,
        amount: item._sum.amount ? item._sum.amount.toNumber() : 0
      }));
    } catch (dbError) {
      console.warn("BurnedCredit table may not exist yet:", dbError);
      // Return default values if table doesn't exist
    }
    
    return NextResponse.json({ 
      total: totalBurned._sum.amount ? totalBurned._sum.amount.toNumber() : 0,
      byAction: burnedByActionFormatted
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to get burned credits:", error);
    return NextResponse.json({ 
      error: "Failed to get burned credits. See server logs." 
    }, { status: 500 });
  }
} 