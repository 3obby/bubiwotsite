import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Get userId from the URL parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return the user's credits and additional info
    return NextResponse.json({ 
      userId: user.id,
      credits: user.credits,
      alias: user.alias,
      hasLoggedIn: user.hasLoggedIn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to get credits:", error);
    return NextResponse.json({ 
      error: "Failed to get credits. See server logs." 
    }, { status: 500 });
  }
} 