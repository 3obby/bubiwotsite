import { NextRequest, NextResponse } from 'next/server';
import { recalculateAllEffectiveValues, cleanupExpiredContent } from '@/lib/timeDecay';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here for admin access
    const { adminKey } = await request.json();
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting manual recalculation of all effective values...');
    
    // Recalculate all effective values
    const recalcResult = await recalculateAllEffectiveValues();
    
    // Clean up expired content
    const cleanupResult = await cleanupExpiredContent();
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      recalculation: {
        postsUpdated: recalcResult.postsUpdated,
        repliesUpdated: recalcResult.repliesUpdated,
        expiredFound: recalcResult.expired
      },
      cleanup: {
        postsArchived: cleanupResult.postsArchived,
        repliesArchived: cleanupResult.repliesArchived
      },
      summary: `Updated ${recalcResult.postsUpdated} posts and ${recalcResult.repliesUpdated} replies. Archived ${cleanupResult.postsArchived} expired posts and ${cleanupResult.repliesArchived} expired replies.`
    };
    
    console.log('Manual recalculation completed:', result.summary);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in manual recalculation:', error);
    return NextResponse.json({ 
      error: 'Failed to recalculate effective values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return current decay configuration and stats
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get some basic stats
    const { prisma } = await import('@/lib/prisma');
    const { DECAY_CONFIG } = await import('@/lib/timeDecay');
    
    const stats = await prisma.$transaction(async (tx) => {
      const totalPosts = await tx.post.count();
      const expiredPosts = await tx.post.count({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });
      const totalReplies = await tx.reply.count();
      const expiredReplies = await tx.reply.count({
        where: {
          expiresAt: {
            lte: new Date()
          }
        }
      });
      
      return {
        totalPosts,
        expiredPosts,
        totalReplies,
        expiredReplies
      };
    });
    
    return NextResponse.json({
      config: DECAY_CONFIG,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting decay stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get decay stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 