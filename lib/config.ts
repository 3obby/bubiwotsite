// Application Configuration & Preferences
export interface PreferencesConfig {
  tokenEconomy: {
    baseRate: number;
    annualInflationRate: number;
    defaultCredits: number;
    withdrawalCost: number;
    minimumWithdrawal: number;
  };
  costs: {
    messaging: {
      postCharacterCost: number;
      replyCharacterCost: number;
      globalFeedCharacterCost: number;
    };
    actions: {
      manualSave: number;
      updateAlias: number;
      fundAccount: number;
      emojiBaseCost: number;
      emojiAdditionalCost: number;
    };
    fees: {
      systemFeeRate: number;
      protocolFeeRate: number;
      authorShare: number;
      ancestorShare: number;
    };
  };
  thresholds: {
    minimumFunding: number;
    reclaimThreshold: number;
    collectionThreshold: number;
  };
  timeDecay: {
    lambda: number;
    minEffectiveValue: number;
  };
}

// Default configuration with current values
export const defaultPreferences: PreferencesConfig = {
  tokenEconomy: {
    baseRate: 0.0001, // ¤/sec - base token accrual rate
    annualInflationRate: 0.03, // 3% annual inflation
    defaultCredits: 0, // Users start with no credits and must earn through UBI
    withdrawalCost: 0.01, // Cost to withdraw tokens
    minimumWithdrawal: 0.01, // Minimum withdrawal amount
  },
  costs: {
    messaging: {
      postCharacterCost: 0.01, // Reduced from 0.1 (90% reduction)
      replyCharacterCost: 0.005, // Reduced from 0.05 (90% reduction)
      globalFeedCharacterCost: 0.001, // Reduced from 0.01 (90% reduction)
    },
    actions: {
      manualSave: 0.1, // Cost for manual save
      updateAlias: 10, // Cost to change username (credits)
      fundAccount: 1, // Cost to switch accounts (credits)
      emojiBaseCost: 0.001, // Base cost for emoji reactions
      emojiAdditionalCost: 0.0005, // Additional cost for subsequent emojis
    },
    fees: {
      systemFeeRate: 0.03, // 3% system fee on tips
      protocolFeeRate: 0.03, // 3% protocol fee (gets burned)
      authorShare: 0.85, // 85% goes to author
      ancestorShare: 0.12, // 12% to thread ancestors
    },
  },
  thresholds: {
    minimumFunding: 0.000777, // Minimum amount to fund account
    reclaimThreshold: 0.001, // Minimum amount to reclaim from time decay
    collectionThreshold: 0.01, // Minimum amount needed to collect tokens
  },
  timeDecay: {
    lambda: 0.0001, // Approximately 1% decay per day
    minEffectiveValue: 0.001, // Minimum effective value for time decay
  },
};

// FAQ entries explaining the magic numbers
export const preferencesExplanations = {
  tokenEconomy: {
    baseRate: "This is the fundamental earning rate for all users. Set to provide ~¤8.64 per day (¤260/month) at continuous accrual.",
    annualInflationRate: "Keeps the token supply growth manageable while providing slight appreciation incentive for long-term holders.",
    defaultCredits: "Users start with zero credits and must earn them through the UBI system, ensuring fair distribution and preventing abuse.",
    withdrawalCost: "Anti-spam measure that prevents micro-withdrawals and reduces blockchain congestion.",
    minimumWithdrawal: "Ensures withdrawals are economically viable after transaction costs.",
  },
  costs: {
    messaging: {
      postCharacterCost: "Reduced to 10% of original cost (was 0.1) to encourage more posting activity.",
      replyCharacterCost: "Reduced to 10% of original cost (was 0.05) to promote discussion and engagement.",
      globalFeedCharacterCost: "Reduced to 10% of original cost (was 0.01) to increase participation in global conversations.",
    },
    actions: {
      manualSave: "Prevents spam saves while allowing users to manually secure their progress.",
      updateAlias: "High enough to prevent username squatting, low enough to allow legitimate changes.",
      fundAccount: "Minimal cost to transfer between accounts while preventing abuse.",
      emojiBaseCost: "Low barrier to emotional expression while maintaining some value.",
      emojiAdditionalCost: "Slight discount for multiple reactions to encourage engagement.",
    },
    fees: {
      systemFeeRate: "Funds platform operations and development while keeping most value with creators.",
      protocolFeeRate: "Burns tokens to create deflationary pressure, balancing the token supply.",
      authorShare: "Ensures content creators get the majority of the economic value they generate.",
      ancestorShare: "Rewards earlier contributors who built the foundation for current discussions.",
    },
  },
  thresholds: {
    minimumFunding: "Prevents dust transactions while allowing meaningful account funding.",
    reclaimThreshold: "Minimum value worth reclaiming to avoid gas cost inefficiencies.",
    collectionThreshold: "Balance between allowing frequent collection and preventing spam.",
  },
  timeDecay: {
    lambda: "Slow decay rate that maintains stake value over reasonable time periods.",
    minEffectiveValue: "Prevents stakes from becoming completely worthless over time.",
  },
};

// Helper function to get current configuration (can be extended for user preferences later)
export function getCurrentConfig(): PreferencesConfig {
  // In the future, this could merge user preferences with defaults
  return defaultPreferences;
}

// Type-safe access to configuration values
export const config = defaultPreferences; 