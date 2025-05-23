import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be a number between 1 and 100" },
        { status: 400 }
      );
    }
    
    // Fetch historical data
    const history = await prisma.globalTokenBalance.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });
    
    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching global balance history:", error);
    return NextResponse.json(
      { error: "Failed to fetch global balance history" },
      { status: 500 }
    );
  }
} 