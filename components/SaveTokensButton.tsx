'use client';

import React, { useState, useEffect } from 'react';

interface TokenStatus {
  tokensEarned: number;
  transactionCost: number;
  netTokens: number;
  secondsElapsed: number;
  canWithdraw: boolean;
  currentBalance: number;
  timeToNextEligible: number;
}

interface SaveTokensButtonProps {
  onTokensUpdated?: (newBalance: number) => void;
  compact?: boolean; // For smaller button version
}

// Enhanced loading spinner component
const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
  );
};

export default function SaveTokensButton({ onTokensUpdated, compact = false }: SaveTokensButtonProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  const fetchTokenStatus = async () => {
    try {
      const sessionId = localStorage.getItem('bubiwot_session_id');
      const password = localStorage.getItem('bubiwot_user_password');
      const userId = localStorage.getItem('bubiwot_user_id');

      if (!sessionId && !password && !userId) {
        setError('No session found');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (password) params.append('password', password);
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/tokens/withdraw?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      console.log('Token status response:', data);
      console.log('Can withdraw?', data.canWithdraw);
      console.log('Net tokens:', data.netTokens);
      console.log('Current balance:', data.currentBalance);
      console.log('Transaction cost:', data.transactionCost);

      setTokenStatus(data);
      setError(null);
      setIsLoading(false);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching token status:', err);
      setError('Failed to fetch token status');
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!tokenStatus?.canWithdraw || isWithdrawing) return;

    setIsWithdrawing(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('bubiwot_session_id');
      const password = localStorage.getItem('bubiwot_user_password');
      const userId = localStorage.getItem('bubiwot_user_id');

      const response = await fetch('/api/tokens/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          password,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      // Update token status
      await fetchTokenStatus();
      
      // Notify parent component of balance update
      if (onTokensUpdated) {
        onTokensUpdated(data.newBalance);
      }

      console.log('Tokens withdrawn successfully:', data);
    } catch (err) {
      console.error('Error withdrawing tokens:', err);
      setError('Failed to withdraw tokens');
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchTokenStatus();
    
    // Refresh status every 10 seconds
    const interval = setInterval(() => {
      if (isLiveUpdating) {
        fetchTokenStatus();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLiveUpdating]);

  if (error) {
    return compact ? (
      <div className="text-sm text-red-500 animate-fadeIn">Error</div>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 animate-slideDown">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchTokenStatus}
            className="ml-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !tokenStatus) {
    return compact ? (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <LoadingSpinner size="sm" />
        Loading...
      </div>
    ) : (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-fadeIn">
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="md" />
          <span className="text-gray-600">Loading token status...</span>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (compact) {
    return (
      <div className="animate-fadeIn">
        <button
          onClick={handleWithdraw}
          disabled={!tokenStatus.canWithdraw || isWithdrawing}
          className={`text-sm px-3 py-1 rounded transition-all duration-200 transform hover:scale-105 ${
            tokenStatus.canWithdraw
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={
            tokenStatus.canWithdraw
              ? `Withdraw ¤${tokenStatus.netTokens.toFixed(6)} (earned ¤${tokenStatus.tokensEarned.toFixed(6)} - ¤0.01 fee)`
              : tokenStatus.timeToNextEligible > 0
              ? `Need to wait ${formatTime(tokenStatus.timeToNextEligible)} more`
              : 'Insufficient balance for transaction fee'
          }
        >
          {isWithdrawing ? (
            <div className="flex items-center gap-1">
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </div>
          ) : (
            `Save (-¤0.01)`
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-slideUp">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Token Earnings</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            Active for {formatTime(tokenStatus.secondsElapsed)}
          </div>
          <button
            onClick={() => setIsLiveUpdating(!isLiveUpdating)}
            className={`text-xs px-2 py-1 rounded-full transition-all ${
              isLiveUpdating
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isLiveUpdating ? 'Live updates enabled' : 'Live updates disabled'}
          >
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isLiveUpdating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isLiveUpdating ? 'Live' : 'Paused'}
            </div>
          </button>
        </div>
      </div>

      {/* Real-time status indicator */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          {isLiveUpdating && (
            <span className="text-green-600 animate-pulse">●</span>
          )}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between animate-fadeIn">
          <span className="text-gray-600">Tokens earned:</span>
          <span className="font-medium text-green-600">¤{tokenStatus.tokensEarned.toFixed(6)}</span>
        </div>
        <div className="flex justify-between animate-fadeIn">
          <span className="text-gray-600">Transaction fee:</span>
          <span className="text-red-600">-¤{tokenStatus.transactionCost.toFixed(3)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 animate-fadeIn">
          <span className="text-gray-900 font-medium">Net withdrawal:</span>
          <span className={`font-bold transition-colors ${tokenStatus.netTokens > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¤{tokenStatus.netTokens.toFixed(6)}
          </span>
        </div>
        <div className="flex justify-between animate-fadeIn">
          <span className="text-gray-600">Current balance:</span>
          <span className="font-medium">¤{tokenStatus.currentBalance.toFixed(6)}</span>
        </div>
      </div>

      {!tokenStatus.canWithdraw && tokenStatus.timeToNextEligible > 0 && (
        <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 animate-slideDown">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Need to wait {formatTime(tokenStatus.timeToNextEligible)} more to earn enough for withdrawal
          </div>
        </div>
      )}

      {!tokenStatus.canWithdraw && tokenStatus.timeToNextEligible === 0 && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 animate-slideDown">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Insufficient balance for transaction fee
          </div>
        </div>
      )}

      <button
        onClick={handleWithdraw}
        disabled={!tokenStatus.canWithdraw || isWithdrawing}
        className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-all duration-200 transform hover:scale-105 ${
          tokenStatus.canWithdraw
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isWithdrawing ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Withdrawing tokens...</span>
          </div>
        ) : tokenStatus.canWithdraw ? (
          `Withdraw ¤${tokenStatus.netTokens.toFixed(6)}`
        ) : (
          'Cannot withdraw yet'
        )}
      </button>
    </div>
  );
} 