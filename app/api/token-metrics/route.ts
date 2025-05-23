import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Constants for token distribution
const TOTAL_TARGET_TOKENS = 10_000_000_000_000; // 10,000 trillion tokens
const TARGET_POPULATION = 10_000_000_000; // 10 billion humans
const TOKENS_PER_HUMAN = 1_000_000; // 1 million tokens per human
const DISTRIBUTION_START_YEAR = 2025;
const DISTRIBUTION_END_YEAR = 2035;

export async function GET() {
  try {
    console.log("Fetching global token metrics...");
    
    // Get total burned tokens
    const burnedCredits = await prisma.burnedCredit.aggregate({
      _sum: {
        amount: true
      }
    });
    
    const totalBurned = burnedCredits._sum.amount ? burnedCredits._sum.amount.toNumber() : 0;
    
    // Current total issued - this would come from your token issuance system
    // For now, using a placeholder value that grows over time
    const baseIssuance = 100_000_000; // Base issuance
    const currentDate = new Date();
    const daysActive = Math.floor((currentDate.getTime() - new Date('2023-01-01').getTime()) / (1000 * 60 * 60 * 24));
    const totalIssued = baseIssuance + (daysActive * 1000); // Grow by 1000 tokens per day
    
    // Calculate circulating supply
    const circulating = totalIssued - totalBurned;
    
    // Calculate distribution progress
    const distributionProgress = (totalIssued / TOTAL_TARGET_TOKENS) * 100;
    
    // Get token distribution history
    // In a real implementation, you'd query historical data points
    // For now, we'll create a simple historical data set
    const today = new Date();
    const history = [
      {
        time: new Date(today.setDate(today.getDate() - 30)), // 30 days ago
        totalIssued: totalIssued - 30000,
        totalBurned: totalBurned * 0.8,
        circulating: (totalIssued - 30000) - (totalBurned * 0.8)
      },
      {
        time: new Date(today.setDate(today.getDate() + 15)), // 15 days ago
        totalIssued: totalIssued - 15000,
        totalBurned: totalBurned * 0.9,
        circulating: (totalIssued - 15000) - (totalBurned * 0.9)
      },
      {
        time: new Date(), // Today
        totalIssued,
        totalBurned,
        circulating
      }
    ];
    
    return NextResponse.json({ 
      totalIssued,
      circulating,
      totalBurned,
      lastUpdated: new Date(),
      distributionProgress,
      tokensPerHuman: TOKENS_PER_HUMAN,
      targetPopulation: TARGET_POPULATION,
      distributionTimeframe: `${DISTRIBUTION_START_YEAR}-${DISTRIBUTION_END_YEAR}`,
      history,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching token metrics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch token metrics" },
      { status: 500 }
    );
  }
} 