import { NextRequest, NextResponse } from 'next/server';
import { calculateEffectiveValue, calculateExpirationTime, calculateReclaimableStake, formatTimeRemaining, DECAY_CONFIG } from '@/lib/timeDecay';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    console.log('🧪 Testing Time Decay System');

    // Test 1: Basic decay calculation
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const baseStake = 10.0;
    const donations = 5.0;

    const effectiveNow = calculateEffectiveValue(baseStake, donations, now);
    const effectiveOneHour = calculateEffectiveValue(baseStake, donations, oneHourAgo);
    const effectiveOneDay = calculateEffectiveValue(baseStake, donations, oneDayAgo);

    // Test 2: Expiration calculation
    const expirationTime = calculateExpirationTime(baseStake, donations, oneDayAgo);

    // Test 3: Reclaim calculation
    const reclaimData = calculateReclaimableStake(baseStake, donations, oneDayAgo);

    // Test 4: Edge cases
    const veryOldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
    const veryOldEffective = calculateEffectiveValue(baseStake, donations, veryOldDate);
    const zeroStakeEffective = calculateEffectiveValue(0, 0, oneDayAgo);
    const highStake = 1000.0;
    const highEffective = calculateEffectiveValue(highStake, 0, oneDayAgo);

    const results = {
      config: DECAY_CONFIG,
      tests: {
        basicDecay: {
          baseStake,
          donations,
          effectiveNow: Number(effectiveNow.toFixed(6)),
          effectiveOneHour: Number(effectiveOneHour.toFixed(6)),
          effectiveOneDay: Number(effectiveOneDay.toFixed(6)),
          decayAfterOneHour: Number(((1 - effectiveOneHour / (baseStake + donations)) * 100).toFixed(4)),
          decayAfterOneDay: Number(((1 - effectiveOneDay / (baseStake + donations)) * 100).toFixed(4))
        },
        expiration: {
          expirationTime: expirationTime?.toISOString(),
          timeRemaining: formatTimeRemaining(expirationTime)
        },
        reclaim: {
          reclaimableStake: Number(reclaimData.reclaimableStake.toFixed(6)),
          reclaimableDonations: Number(reclaimData.reclaimableDonations.toFixed(6)),
          totalReclaim: Number(reclaimData.totalReclaim.toFixed(6))
        },
        edgeCases: {
          veryOldEffective: Number(veryOldEffective.toFixed(6)),
          zeroStakeEffective: Number(zeroStakeEffective.toFixed(6)),
          highStakeEffective: Number(highEffective.toFixed(6))
        }
      },
      summary: {
        decayWorking: effectiveOneDay < effectiveNow,
        expirationCalculated: !!expirationTime,
        reclaimCalculated: reclaimData.totalReclaim > 0,
        configValid: DECAY_CONFIG.lambda > 0 && DECAY_CONFIG.maxLifespanMs > 0
      }
    };

    console.log('✅ Time decay tests completed!', results.summary);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error testing time decay:', error);
    return NextResponse.json({ 
      error: 'Failed to test time decay',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 