import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("Fetching total burned credits...");
    
    // Sum all burned credits from the BurnedCredit table
    const burnedCredits = await prisma.burnedCredit.aggregate({
      _sum: {
        amount: true
      }
    });
    
    const totalBurned = burnedCredits._sum.amount || 0;
    console.log(`Total burned credits: ${totalBurned}`);
    
    return NextResponse.json({ 
      totalBurned,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching total burned credits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch total burned credits" },
      { status: 500 }
    );
  }
} 