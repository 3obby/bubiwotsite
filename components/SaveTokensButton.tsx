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

export default function SaveTokensButton({ onTokensUpdated, compact = false }: SaveTokensButtonProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchTokenStatus = async () => {
    try {
      const sessionId = localStorage.getItem('bubiwot_session_id');
      const password = localStorage.getItem('bubiwot_user_password');
      const userId = localStorage.getItem('bubiwot_user_id');

      if (!sessionId && !password && !userId) {
        setError('No session found');
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
        return;
      }

      console.log('Token status response:', data);
      console.log('Can withdraw?', data.canWithdraw);
      console.log('Net tokens:', data.netTokens);
      console.log('Current balance:', data.currentBalance);
      console.log('Transaction cost:', data.transactionCost);

      setTokenStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching token status:', err);
      setError('Failed to fetch token status');
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
    const interval = setInterval(fetchTokenStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return compact ? (
      <div className="text-sm text-gray-500">...</div>
    ) : (
      <div className="text-center py-4 text-gray-500">Loading token status...</div>
    );
  }

  if (error) {
    return compact ? (
      <div className="text-sm text-red-500">Error</div>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!tokenStatus) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (compact) {
    return (
      <button
        onClick={handleWithdraw}
        disabled={!tokenStatus.canWithdraw || isWithdrawing}
        className={`text-sm px-3 py-1 rounded transition-colors ${
          tokenStatus.canWithdraw
            ? 'bg-green-600 text-white hover:bg-green-700'
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
        {isWithdrawing ? '...' : `Save (-¤0.01)`}
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Token Earnings</h3>
        <div className="text-sm text-gray-500">
          Active for {formatTime(tokenStatus.secondsElapsed)}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Tokens earned:</span>
          <span className="font-medium">¤{tokenStatus.tokensEarned.toFixed(6)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Transaction fee:</span>
          <span className="text-red-600">-¤{tokenStatus.transactionCost.toFixed(3)}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="text-gray-900 font-medium">Net withdrawal:</span>
          <span className={`font-bold ${tokenStatus.netTokens > 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¤{tokenStatus.netTokens.toFixed(6)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Current balance:</span>
          <span className="font-medium">¤{tokenStatus.currentBalance.toFixed(6)}</span>
        </div>
      </div>

      {!tokenStatus.canWithdraw && tokenStatus.timeToNextEligible > 0 && (
        <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Need to wait {formatTime(tokenStatus.timeToNextEligible)} more to earn enough for withdrawal
        </div>
      )}

      {!tokenStatus.canWithdraw && tokenStatus.timeToNextEligible === 0 && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          Insufficient balance for transaction fee
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleWithdraw}
          disabled={!tokenStatus.canWithdraw || isWithdrawing}
          className={`w-full py-2 px-4 rounded font-medium transition-colors ${
            tokenStatus.canWithdraw
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isWithdrawing ? 'Withdrawing...' : 'Save Tokens (-¤0.01)'}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Earning rate: ¤0.0001/second (¤8.64/day)
      </div>
    </div>
  );
} 