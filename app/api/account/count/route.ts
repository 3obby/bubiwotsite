import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Count users where alias was set via import rather than default
    const count = await prisma.user.count();
    
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Failed to get user count:", error);
    return NextResponse.json({ 
      error: "Failed to get user count. See server logs." 
    }, { status: 500 });
  }
} 