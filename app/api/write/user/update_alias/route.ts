import { NextResponse } from 'next/server';
import { ACTIONS, processWriteAction } from '../../base';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, newAlias } = body;
    
    if (!userId || !newAlias) {
      return NextResponse.json({ 
        error: "User ID and new alias are required" 
      }, { status: 400 });
    }
    
    const result = await processWriteAction(
      userId, 
      ACTIONS.UPDATE_ALIAS,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (user) => {
        // Update the alias
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { alias: newAlias }
        });
        
        return { 
          success: true, 
          message: "Alias updated successfully",
          alias: updatedUser.alias,
          credits: updatedUser.credits
        };
      }
    );
    
    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }
    
    return NextResponse.json(result.result, { status: 200 });
  } catch (error) {
    console.error("Failed to update alias:", error);
    return NextResponse.json({ 
      error: "Failed to update alias. See server logs." 
    }, { status: 500 });
  }
} 