import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Define the standard type for write actions
export type WriteAction = {
  name: string;
  cost: number;
  description: string;
};

// Helper to convert number to Decimal
export function toDecimal(value: number): Decimal {
  return new Decimal(value);
}

// Define available actions with their costs
export const ACTIONS = {
  UPDATE_ALIAS: {
    name: 'update_alias',
    cost: 10,
    description: 'Change account alias'
  },
  SWITCH_ACCOUNT: {
    name: 'switch_account',
    cost: 1,
    description: 'Switch to another account'
  },
  FUND_ACCOUNT: {
    name: 'fund_account',
    cost: 0.000777,
    description: 'Convert accrued value to credits'
  }
};

// Check if user has enough credits for an action
export async function checkCredits(userId: string, action: WriteAction): Promise<{ 
  hasEnough: boolean; 
  user: Awaited<ReturnType<typeof prisma.user.findUnique>>; 
  error?: string 
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return { 
        hasEnough: false, 
        user: null, 
        error: "User not found" 
      };
    }
    
    if (user.credits.lessThan(action.cost)) {
      return { 
        hasEnough: false, 
        user, 
        error: `Not enough credits. You need ${action.cost} credits for this action.` 
      };
    }
    
    return { hasEnough: true, user };
  } catch (error) {
    console.error(`Error checking credits: ${error}`);
    return { 
      hasEnough: false, 
      user: null, 
      error: "Failed to check credits balance" 
    };
  }
}

// Process a write action with credit deduction and burning
export async function processWriteAction(
  userId: string, 
  action: WriteAction, 
  callback: (user: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>) => Promise<unknown>
) {
  const { hasEnough, user, error } = await checkCredits(userId, action);
  
  if (!hasEnough || !user) {
    return { success: false, message: error };
  }
  
  try {
    // Get or create a global balance record
    const latestBalance = await prisma.globalTokenBalance.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    // Create a new global balance record with the burned amount
    const newGlobalBalance = await prisma.globalTokenBalance.create({
      data: {
        totalIssued: latestBalance ? latestBalance.totalIssued : new Decimal(0),
        totalBurned: latestBalance 
          ? latestBalance.totalBurned.plus(toDecimal(action.cost)) 
          : toDecimal(action.cost),
        circulating: latestBalance 
          ? latestBalance.circulating.minus(toDecimal(action.cost)) 
          : new Decimal(0).minus(toDecimal(action.cost))
      }
    });

    // Create a transaction to update user and create burned credit record
    const result = await prisma.$transaction([
      // Deduct credits
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: toDecimal(action.cost)
          }
        }
      }),
      
      // Create burned credit record
      prisma.burnedCredit.create({
        data: {
          userId,
          amount: toDecimal(action.cost),
          action: action.name,
          balanceBefore: user.credits,
          balanceAfter: user.credits.minus(toDecimal(action.cost)),
          globalBalanceId: newGlobalBalance.id // Link to the global balance
        }
      })
    ]);
    
    const updatedUser = result[0];
    
    // Call the callback with the updated user
    const callbackResult = await callback(updatedUser);
    
    return { 
      success: true, 
      data: updatedUser,
      result: callbackResult 
    };
  } catch (error) {
    console.error(`Failed to process ${action.name}: ${error}`);
    return { 
      success: false, 
      message: `Failed to process ${action.description}. See server logs.`
    };
  }
} 