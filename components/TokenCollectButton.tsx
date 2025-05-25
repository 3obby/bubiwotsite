'use client';

import React, { useState } from 'react';

interface LifetimeMetrics {
  allocated: number;
  collected: number;
  burned?: number;
  collectionPercentage: number;
}

interface TokenCollectButtonProps {
  accruedValue: number;
  userId?: string;
  userPassword?: string;
  sessionId?: string;
  onTokensCollected?: (newBalance: number, lifetimeMetrics?: LifetimeMetrics) => Promise<void>;
}

export default function TokenCollectButton({ accruedValue, onTokensCollected, userId, userPassword, sessionId }: TokenCollectButtonProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side validation: check if accrued value meets minimum
  const clientCanCollect = accruedValue >= 0.01;

  const handleDirectCollection = async () => {
    if (!clientCanCollect || isCollecting) return;

    setIsCollecting(true);
    setError(null);
    
    console.log('🔵 Starting direct token collection...');
    console.log('💰 Accrued value:', accruedValue);

    try {
      // Use props instead of localStorage
      const authSessionId = sessionId || localStorage.getItem('bubiwot_session_id');
      const authPassword = userPassword || localStorage.getItem('bubiwot_user_password');
      const authUserId = userId || localStorage.getItem('bubiwot_user_id');

      console.log('🔑 Auth data:', {
        sessionId: authSessionId ? 'present' : 'missing',
        password: authPassword ? 'present' : 'missing', 
        userId: authUserId ? 'present' : 'missing'
      });

      const requestBody = {
        sessionId: authSessionId,
        password: authPassword,
        userId: authUserId,
        confirmedAccruedAmount: accruedValue, // Send client-calculated amount for validation
      };
      
      console.log('📤 Request body:', requestBody);

      const response = await fetch('/api/tokens/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 Server response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        console.error('❌ Collection failed:', data.error);
        setError(data.error);
        // Briefly show error, then clear it
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Success - notify parent
      console.log('✅ Collection successful!');
      console.log('💳 New balance from server:', data.newBalance);
      console.log('📊 Full server response:', data);
      
      if (onTokensCollected) {
        console.log('🔄 Calling onTokensCollected with balance:', data.newBalance);
        await onTokensCollected(data.newBalance, data.lifetimeMetrics);
      } else {
        console.warn('⚠️ No onTokensCollected callback provided');
      }
      
      console.log('🎉 Direct token collection completed successfully');
    } catch (err) {
      console.error('💥 Error collecting tokens:', err);
      setError('Failed to collect tokens');
      // Briefly show error, then clear it
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsCollecting(false);
    }
  };

  // Main button with error display
  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleDirectCollection}
        disabled={!clientCanCollect || isCollecting}
        className={`w-12 h-12 rounded-md flex flex-col items-center justify-center transition-colors ${
          clientCanCollect && !isCollecting
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={
          clientCanCollect
            ? `Collect accrued tokens (¤${accruedValue.toFixed(6)} - ¤0.01 fee)`
            : `Need ¤0.01 accrued (currently ¤${accruedValue.toFixed(6)})`
        }
      >
        {isCollecting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white mb-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Saving</span>
          </>
        ) : (
          <>
            <span className="text-lg">💾</span>
            <span className="text-xs">¤0.01</span>
          </>
        )}
      </button>
      
      {/* Show error below button if any */}
      {error && (
        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
} 