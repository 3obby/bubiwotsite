import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();
    
    if (!userId || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Find current user and check credits
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }
    
    // Check if user has enough credits
    if (currentUser.credits.lessThan(1)) {
      return NextResponse.json({ 
        error: "Not enough credits. You need 1 credit to switch accounts." 
      }, { status: 403 });
    }
    
    // Find target user by password
    const targetUser = await prisma.user.findFirst({
      where: { password }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    
    // Create a transaction to deduct credit and create burned credit record
    await prisma.$transaction([
      // Deduct credit from current user
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: 1 }
        }
      }),
      
      // Create burned credit record
      prisma.burnedCredit.create({
        data: {
          userId,
          amount: new Decimal(1),
          action: "switch_account",
          balanceBefore: currentUser.credits,
          balanceAfter: currentUser.credits.minus(1),
          globalBalanceId: null // Optional field for this action
        }
      }),
      
      // Update target user's hasLoggedIn status if needed
      prisma.user.update({
        where: { id: targetUser.id },
        data: {
          hasLoggedIn: true
        }
      })
    ]);
    
    // Return the target user information
    return NextResponse.json({ 
      success: true, 
      message: "Account switched successfully",
      userId: targetUser.id,
      alias: targetUser.alias,
      password: targetUser.password,
      credits: targetUser.credits,
      hasLoggedIn: true
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to switch account:", error);
    return NextResponse.json({ 
      error: "Failed to switch account. See server logs." 
    }, { status: 500 });
  }
} 