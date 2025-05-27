// Test script for time decay functionality
const { calculateEffectiveValue, calculateExpirationTime, calculateReclaimableStake, formatTimeRemaining, DECAY_CONFIG } = require('./lib/timeDecay');

console.log('🧪 Testing Time Decay System\n');

// Test 1: Basic decay calculation
console.log('Test 1: Basic Decay Calculation');
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const baseStake = 10.0;
const donations = 5.0;

console.log(`Base stake: ¤${baseStake}`);
console.log(`Donations: ¤${donations}`);
console.log(`Decay rate (lambda): ${DECAY_CONFIG.lambda}`);

const effectiveNow = calculateEffectiveValue(baseStake, donations, now);
const effectiveOneHour = calculateEffectiveValue(baseStake, donations, oneHourAgo);
const effectiveOneDay = calculateEffectiveValue(baseStake, donations, oneDayAgo);

console.log(`Effective value (just created): ¤${effectiveNow.toFixed(6)}`);
console.log(`Effective value (1 hour old): ¤${effectiveOneHour.toFixed(6)}`);
console.log(`Effective value (1 day old): ¤${effectiveOneDay.toFixed(6)}`);
console.log(`Decay after 1 hour: ${((1 - effectiveOneHour / (baseStake + donations)) * 100).toFixed(4)}%`);
console.log(`Decay after 1 day: ${((1 - effectiveOneDay / (baseStake + donations)) * 100).toFixed(4)}%`);

// Test 2: Expiration calculation
console.log('\nTest 2: Expiration Calculation');
const expirationTime = calculateExpirationTime(baseStake, donations, oneDayAgo);
console.log(`Post created 1 day ago expires at: ${expirationTime?.toISOString()}`);
console.log(`Time remaining: ${formatTimeRemaining(expirationTime)}`);

// Test 3: Reclaim calculation
console.log('\nTest 3: Reclaim Calculation');
const reclaimData = calculateReclaimableStake(baseStake, donations, oneDayAgo);
console.log(`Reclaimable stake: ¤${reclaimData.reclaimableStake.toFixed(6)}`);
console.log(`Reclaimable donations: ¤${reclaimData.reclaimableDonations.toFixed(6)}`);
console.log(`Total reclaimable: ¤${reclaimData.totalReclaim.toFixed(6)}`);

// Test 4: Edge cases
console.log('\nTest 4: Edge Cases');

// Very old post
const veryOldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
const veryOldEffective = calculateEffectiveValue(baseStake, donations, veryOldDate);
console.log(`Very old post (100 days) effective value: ¤${veryOldEffective.toFixed(6)}`);

// Zero stake
const zeroStakeEffective = calculateEffectiveValue(0, 0, oneDayAgo);
console.log(`Zero stake effective value: ¤${zeroStakeEffective.toFixed(6)}`);

// High value post
const highStake = 1000.0;
const highEffective = calculateEffectiveValue(highStake, 0, oneDayAgo);
console.log(`High stake (¤${highStake}) after 1 day: ¤${highEffective.toFixed(6)}`);

console.log('\n✅ Time decay tests completed!');
console.log('\nDecay Configuration:');
console.log(`- Lambda (decay rate): ${DECAY_CONFIG.lambda}`);
console.log(`- Max lifespan: ${DECAY_CONFIG.maxLifespanMs / (24 * 60 * 60 * 1000)} days`);
console.log(`- Min effective value: ¤${DECAY_CONFIG.minEffectiveValue}`);
console.log(`- Grace period: ${DECAY_CONFIG.gracePeriodMs / (60 * 60 * 1000)} hours`); 