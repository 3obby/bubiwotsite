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
    
    // Ensure proper number conversion from Decimal
    const credits = parseFloat(user.credits.toString());
    
    console.log(`📤 get-credits API response for user ${userId}:`);
    console.log(`  💰 Raw database credits: ${user.credits}`);
    console.log(`  💳 Converted credits: ${credits} (type: ${typeof credits})`);
    console.log(`  👤 Alias: ${user.alias}`);
    console.log(`  🔐 Has logged in: ${user.hasLoggedIn}`);
    
    const responseData = { 
      userId: user.id,
      credits: credits, // Ensure it's a number
      alias: user.alias,
      hasLoggedIn: user.hasLoggedIn,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    console.log(`  📦 Final response data:`, responseData);

    // Return the user's credits and additional info
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Failed to get credits:", error);
    return NextResponse.json({ 
      error: "Failed to get credits. See server logs." 
    }, { status: 500 });
  }
} 