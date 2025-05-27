# Time Decay System Implementation

## Overview

This document describes the implementation of a time decay system for the Reddit-like message board. Posts are indexed by value that decays over time using exponential decay, allowing authors to reclaim any released portion of their stake at any time.

## Core Concept

Posts have an **effective value** that decreases exponentially over time according to the formula:

```
effectiveValue = baseStake * e^(-λt) + totalDonations * e^(-λt_donation)
```

Where:
- `λ` (lambda) = decay rate constant (0.0001 ≈ 1% decay per day)
- `t` = time elapsed since post creation (in seconds)
- `t_donation` = time elapsed since last donation (in seconds)

## Key Features

### 1. Exponential Decay
- Posts lose value over time at a configurable rate
- Donations reset the decay timer for the donated portion
- Authors can reclaim the decayed portion of their stake

### 2. Visual Countdown Timers
- Real-time countdown showing time until expiration
- Effective value display showing current ranking value
- Hover tooltips with detailed breakdown

### 3. Reclaim Functionality
- Authors can reclaim stake that has decayed
- One-click reclaim button for post owners
- Automatic calculation of reclaimable amounts

### 4. Automatic Cleanup
- Expired posts are automatically archived (effective value set to 0)
- Background processes clean up expired content
- Ranking updates triggered by new posts, donations, and reactions

## Implementation Details

### Core Files

#### `lib/timeDecay.ts`
Contains all decay calculation functions:
- `calculateEffectiveValue()` - Computes current effective value
- `calculateExpirationTime()` - Determines when post expires
- `calculateReclaimableStake()` - Calculates reclaimable amounts
- `recalculateAllEffectiveValues()` - Updates all posts/replies
- `cleanupExpiredContent()` - Archives expired content

#### `components/TimeDecayDisplay.tsx`
React component for displaying:
- Countdown timer
- Effective value
- Reclaim button (for authors)
- Detailed tooltips

#### API Endpoints
- `POST /api/posts/reclaim` - Reclaim stake from posts
- `POST /api/admin/recalculate-decay` - Manual recalculation trigger
- `GET /api/test-decay` - Test decay calculations

### Database Schema Updates

The following fields were added to support time decay:

```sql
-- Posts table
ALTER TABLE posts ADD COLUMN stake DECIMAL(10,6) DEFAULT 0;
ALTER TABLE posts ADD COLUMN effective_value DECIMAL(10,6) DEFAULT 0;
ALTER TABLE posts ADD COLUMN expires_at TIMESTAMP;

-- Replies table  
ALTER TABLE replies ADD COLUMN stake DECIMAL(10,6) DEFAULT 0;
ALTER TABLE replies ADD COLUMN effective_value DECIMAL(10,6) DEFAULT 0;
ALTER TABLE replies ADD COLUMN expires_at TIMESTAMP;
```

### Configuration

Decay parameters are configured in `lib/timeDecay.ts`:

```typescript
export const DECAY_CONFIG = {
  lambda: 0.0001,           // Decay rate (≈1% per day)
  maxLifespanMs: 90 * 24 * 60 * 60 * 1000,  // 90 days max
  minEffectiveValue: 0.001, // Minimum before expiration
  gracePeriodMs: 24 * 60 * 60 * 1000,       // 24h grace period
};
```

## Usage Examples

### Creating a Post with Decay
```typescript
// When creating a post, set initial values
const post = await prisma.post.create({
  data: {
    content: "Hello world",
    stake: promotionValue,
    effectiveValue: promotionValue,
    expiresAt: calculateExpirationTime(promotionValue, 0, new Date())
  }
});
```

### Displaying Time Decay Info
```tsx
<TimeDecayDisplay
  postId={post.id}
  authorId={post.authorId}
  currentUserId={user.id}
  stake={parseFloat(post.stake.toString())}
  donatedValue={parseFloat(post.donatedValue.toString())}
  effectiveValue={parseFloat(post.effectiveValue.toString())}
  createdAt={post.createdAt}
  expiresAt={post.expiresAt}
  onReclaim={(amount) => console.log(`Reclaimed ¤${amount}`)}
  userPassword={userPassword}
  sessionId={sessionId}
/>
```

### Reclaiming Stake
```typescript
const response = await fetch('/api/posts/reclaim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postId: 'post-id',
    userId: 'user-id',
    password: 'user-password'
  })
});
```

## Triggers and Updates

The system automatically recalculates effective values when:

1. **New posts are created** - Triggers full recalculation
2. **Donations are made** - Updates specific post and triggers cleanup
3. **Emoji reactions with tips** - Updates target post/reply
4. **Manual admin trigger** - Full system recalculation

### Background Processing

Each trigger includes non-blocking background processing:
```typescript
try {
  const recalcResult = await recalculateAllEffectiveValues();
  const cleanupResult = await cleanupExpiredContent();
  console.log(`Updated ${recalcResult.postsUpdated} posts, archived ${cleanupResult.postsArchived} expired`);
} catch (bgError) {
  console.error('Background processing failed (non-critical):', bgError);
  // Don't fail the main request
}
```

## Testing

### Test Endpoint
Visit `/api/test-decay` to verify calculations:
```json
{
  "config": { "lambda": 0.0001, "maxLifespanMs": 7776000000 },
  "tests": {
    "basicDecay": {
      "baseStake": 10,
      "effectiveOneDay": 0.002653,
      "decayAfterOneDay": 99.9823
    }
  },
  "summary": {
    "decayWorking": true,
    "expirationCalculated": true,
    "reclaimCalculated": true
  }
}
```

### Manual Testing
1. Create a post with promotion value
2. Wait or simulate time passage
3. Check effective value decreases
4. Test reclaim functionality
5. Verify expired posts are archived

## Performance Considerations

### Optimization Strategies
1. **Lazy Updates** - Only recalculate when triggered by user actions
2. **Batch Processing** - Update multiple posts in single transactions
3. **Background Jobs** - Non-blocking cleanup and recalculation
4. **Indexed Queries** - Database indexes on `expiresAt` and `effectiveValue`

### Monitoring
- Track recalculation performance in logs
- Monitor expired content cleanup frequency
- Watch for database query performance

## Security Considerations

1. **Authorization** - Only post authors can reclaim their stake
2. **Validation** - Verify reclaimable amounts before processing
3. **Rate Limiting** - Prevent abuse of reclaim functionality
4. **Admin Access** - Secure admin endpoints with proper authentication

## Future Enhancements

### Potential Improvements
1. **Configurable Decay Rates** - Per-category or per-user decay rates
2. **Decay Curves** - Different mathematical models (linear, logarithmic)
3. **Stake Locking** - Temporary locks to prevent immediate reclaim
4. **Decay Notifications** - Alert users when posts are about to expire
5. **Batch Reclaim** - Reclaim from multiple posts at once

### Advanced Features
1. **Decay Visualization** - Charts showing value over time
2. **Predictive Analytics** - Estimate future value and optimal reclaim timing
3. **Automated Reclaim** - Optional auto-reclaim at specified thresholds
4. **Decay Insurance** - Mechanisms to slow decay for high-quality content

## Troubleshooting

### Common Issues

**Posts not decaying:**
- Check if `effectiveValue` field exists in database
- Verify decay calculations are being triggered
- Ensure background processes are running

**Reclaim not working:**
- Verify user owns the post
- Check if reclaimable amount > minimum threshold
- Ensure proper authentication

**Performance issues:**
- Monitor database query performance
- Consider adding indexes on decay-related fields
- Optimize recalculation frequency

### Debug Endpoints
- `GET /api/admin/recalculate-decay?adminKey=xxx` - View decay stats
- `GET /api/test-decay` - Test calculations
- Check server logs for background processing results

## Conclusion

The time decay system provides a dynamic, fair mechanism for content ranking that:
- Encourages fresh content creation
- Allows stake recovery over time
- Maintains system economic balance
- Provides transparent value calculations

The implementation is designed to be performant, secure, and extensible for future enhancements. 