import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

// Decay configuration
export const DECAY_CONFIG = {
  // Decay rate (lambda) - higher value means faster decay
  lambda: config.timeDecay.lambda, // Approximately 1% decay per day
  
  // Maximum post lifespan in milliseconds
  maxLifespanMs: 90 * 24 * 60 * 60 * 1000, // 90 days
  
  // Minimum effective value before considering expired
  minEffectiveValue: config.timeDecay.minEffectiveValue,
  
  // Grace period before actually expiring (in milliseconds)
  gracePeriodMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Calculate effective value using exponential decay
 * effectiveValue = baseStake * e^(-λt) + totalDonations * e^(-λt_donation)
 */
export function calculateEffectiveValue(
  baseStake: number,
  totalDonations: number,
  createdAt: Date,
  lastDonationAt?: Date
): number {
  const now = Date.now();
  const timeElapsed = (now - createdAt.getTime()) / 1000; // seconds
  
  // Calculate decay for base stake
  const baseDecay = Math.exp(-DECAY_CONFIG.lambda * timeElapsed);
  const baseValue = baseStake * baseDecay;
  
  // Calculate decay for donations (using last donation time if available)
  let donationValue = 0;
  if (totalDonations > 0) {
    const donationTime = lastDonationAt || createdAt;
    const donationTimeElapsed = (now - donationTime.getTime()) / 1000;
    const donationDecay = Math.exp(-DECAY_CONFIG.lambda * donationTimeElapsed);
    donationValue = totalDonations * donationDecay;
  }
  
  return Math.max(0, baseValue + donationValue);
}

/**
 * Calculate when a post will expire based on current value and decay rate
 */
export function calculateExpirationTime(
  baseStake: number,
  totalDonations: number,
  createdAt: Date,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _lastDonationAt?: Date
): Date | null {
  if (baseStake <= 0 && totalDonations <= 0) {
    return new Date(createdAt.getTime() + DECAY_CONFIG.gracePeriodMs);
  }
  
  const now = Date.now();
  const maxExpiration = new Date(createdAt.getTime() + DECAY_CONFIG.maxLifespanMs);
  
  // Calculate time when effective value drops below minimum
  const totalInitialValue = baseStake + totalDonations;
  if (totalInitialValue <= DECAY_CONFIG.minEffectiveValue) {
    return new Date(now + DECAY_CONFIG.gracePeriodMs);
  }
  
  // Solve for time when: totalInitialValue * e^(-λt) = minEffectiveValue
  const timeToMinValue = Math.log(totalInitialValue / DECAY_CONFIG.minEffectiveValue) / DECAY_CONFIG.lambda;
  const calculatedExpiration = new Date(createdAt.getTime() + (timeToMinValue * 1000));
  
  // Return the earlier of calculated expiration or max lifespan
  return calculatedExpiration < maxExpiration ? calculatedExpiration : maxExpiration;
}

/**
 * Calculate how much stake can be reclaimed
 */
export function calculateReclaimableStake(
  originalStake: number,
  totalDonations: number,
  createdAt: Date,
  lastDonationAt?: Date
): { reclaimableStake: number; reclaimableDonations: number; totalReclaim: number } {
  const now = Date.now();
  const timeElapsed = (now - createdAt.getTime()) / 1000;
  
  // Calculate what portion of original stake remains
  const stakeDecay = Math.exp(-DECAY_CONFIG.lambda * timeElapsed);
  const reclaimableStake = originalStake * stakeDecay;
  
  // Calculate what portion of donations remain (using last donation time)
  let reclaimableDonations = 0;
  if (totalDonations > 0 && lastDonationAt) {
    const donationTimeElapsed = (now - lastDonationAt.getTime()) / 1000;
    const donationDecay = Math.exp(-DECAY_CONFIG.lambda * donationTimeElapsed);
    reclaimableDonations = totalDonations * donationDecay;
  }
  
  return {
    reclaimableStake: Math.max(0, reclaimableStake),
    reclaimableDonations: Math.max(0, reclaimableDonations),
    totalReclaim: Math.max(0, reclaimableStake + reclaimableDonations)
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(expiresAt: Date | null): string {
  if (!expiresAt) return '~∞';
  
  const now = Date.now();
  const timeLeft = expiresAt.getTime() - now;
  
  if (timeLeft <= 0) return 'expired';
  
  const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 1) return `~${days}d`;
  if (days === 1) return `~1d ${hours}h`;
  if (hours > 0) return `~${hours}h`;
  return `~${minutes}m`;
}

/**
 * Update effective values for all posts and replies
 */
export async function recalculateAllEffectiveValues(): Promise<{ postsUpdated: number; repliesUpdated: number; expired: number }> {
  let postsUpdated = 0;
  let repliesUpdated = 0;
  let expired = 0;
  
  try {
    // Update posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        stake: true,
        donatedValue: true,
        createdAt: true,
        valueDonations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    
    for (const post of posts) {
      const lastDonationAt = post.valueDonations[0]?.createdAt;
      const effectiveValue = calculateEffectiveValue(
        parseFloat(post.stake.toString()),
        parseFloat(post.donatedValue.toString()),
        post.createdAt,
        lastDonationAt
      );
      
      const expiresAt = calculateExpirationTime(
        parseFloat(post.stake.toString()),
        parseFloat(post.donatedValue.toString()),
        post.createdAt,
        lastDonationAt
      );
      
      await prisma.post.update({
        where: { id: post.id },
        data: {
          effectiveValue,
          expiresAt
        }
      });
      
      postsUpdated++;
      
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        expired++;
      }
    }
    
    // Update replies
    const replies = await prisma.reply.findMany({
      select: {
        id: true,
        stake: true,
        donatedValue: true,
        createdAt: true,
        valueDonations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    
    for (const reply of replies) {
      const lastDonationAt = reply.valueDonations[0]?.createdAt;
      const effectiveValue = calculateEffectiveValue(
        parseFloat(reply.stake.toString()),
        parseFloat(reply.donatedValue.toString()),
        reply.createdAt,
        lastDonationAt
      );
      
      const expiresAt = calculateExpirationTime(
        parseFloat(reply.stake.toString()),
        parseFloat(reply.donatedValue.toString()),
        reply.createdAt,
        lastDonationAt
      );
      
      await prisma.reply.update({
        where: { id: reply.id },
        data: {
          effectiveValue,
          expiresAt
        }
      });
      
      repliesUpdated++;
      
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        expired++;
      }
    }
    
    return { postsUpdated, repliesUpdated, expired };
    
  } catch (error) {
    console.error('Error recalculating effective values:', error);
    throw error;
  }
}

/**
 * Clean up expired posts and replies
 */
export async function cleanupExpiredContent(): Promise<{ postsArchived: number; repliesArchived: number }> {
  const now = new Date();
  
  try {
    // Find expired posts that haven't been processed yet
    const expiredPosts = await prisma.post.findMany({
      where: {
        expiresAt: {
          lte: now
        },
        effectiveValue: {
          gt: 0 // Only process posts that haven't been zeroed out yet
        }
      },
      select: { id: true }
    });
    
    // Set effective value to 0 for expired posts (soft archive)
    const postsResult = await prisma.post.updateMany({
      where: {
        id: {
          in: expiredPosts.map(p => p.id)
        }
      },
      data: {
        effectiveValue: 0
      }
    });
    
    // Find expired replies that haven't been processed yet
    const expiredReplies = await prisma.reply.findMany({
      where: {
        expiresAt: {
          lte: now
        },
        effectiveValue: {
          gt: 0 // Only process replies that haven't been zeroed out yet
        }
      },
      select: { id: true }
    });
    
    // Set effective value to 0 for expired replies (soft archive)
    const repliesResult = await prisma.reply.updateMany({
      where: {
        id: {
          in: expiredReplies.map(r => r.id)
        }
      },
      data: {
        effectiveValue: 0
      }
    });
    
    return {
      postsArchived: postsResult.count,
      repliesArchived: repliesResult.count
    };
    
  } catch (error) {
    console.error('Error cleaning up expired content:', error);
    throw error;
  }
}

/**
 * Recalculate effective values for a specific post and its replies
 */
export async function recalculatePostValues(postId: string): Promise<void> {
  try {
    // Update the main post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        stake: true,
        donatedValue: true,
        createdAt: true,
        valueDonations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    
    if (post) {
      const lastDonationAt = post.valueDonations[0]?.createdAt;
      const effectiveValue = calculateEffectiveValue(
        parseFloat(post.stake.toString()),
        parseFloat(post.donatedValue.toString()),
        post.createdAt,
        lastDonationAt
      );
      
      const expiresAt = calculateExpirationTime(
        parseFloat(post.stake.toString()),
        parseFloat(post.donatedValue.toString()),
        post.createdAt,
        lastDonationAt
      );
      
      await prisma.post.update({
        where: { id: postId },
        data: {
          effectiveValue,
          expiresAt
        }
      });
    }
    
    // Update all replies to this post
    const replies = await prisma.reply.findMany({
      where: { postId },
      select: {
        id: true,
        stake: true,
        donatedValue: true,
        createdAt: true,
        valueDonations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    
    for (const reply of replies) {
      const lastDonationAt = reply.valueDonations[0]?.createdAt;
      const effectiveValue = calculateEffectiveValue(
        parseFloat(reply.stake.toString()),
        parseFloat(reply.donatedValue.toString()),
        reply.createdAt,
        lastDonationAt
      );
      
      const expiresAt = calculateExpirationTime(
        parseFloat(reply.stake.toString()),
        parseFloat(reply.donatedValue.toString()),
        reply.createdAt,
        lastDonationAt
      );
      
      await prisma.reply.update({
        where: { id: reply.id },
        data: {
          effectiveValue,
          expiresAt
        }
      });
    }
    
  } catch (error) {
    console.error(`Error recalculating values for post ${postId}:`, error);
    throw error;
  }
} 