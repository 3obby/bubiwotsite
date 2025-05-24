'use client';

import React, { useState, useEffect } from 'react';

interface TokenCollectButtonProps {
  accruedValue: number; // Passed from main page
  onTokensCollected?: (newBalance: number, lifetimeMetrics?: any) => void;
  userId?: string;
  userPassword?: string;
  sessionId?: string;
}

interface TokenBalanceData {
  user: {
    id: string;
    alias: string;
    credits: number;
    lastWithdrawAt: string;
    lifetimeAllocated: number;
    lifetimeCollected: number;
    lifetimeCollections: number;
  };
  accruedTokens: number;
  currentRate: number;
  canWithdraw: boolean;
  withdrawalCost: number;
  minimumWithdrawal: number;
  secondsSinceLastWithdraw: number;
  lifetimeMetrics: {
    allocated: number;
    collected: number;
    collections: number;
    collectionPercentage: number;
  };
}

export default function TokenCollectButton({ accruedValue, onTokensCollected, userId, userPassword, sessionId }: TokenCollectButtonProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [balanceData, setBalanceData] = useState<TokenBalanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Client-side validation: check if accrued value meets minimum
  const clientCanCollect = accruedValue >= 0.01;

  const fetchBalanceData = async () => {
    try {
      // Use props instead of localStorage
      const authSessionId = sessionId || localStorage.getItem('bubiwot_session_id');
      const authPassword = userPassword || localStorage.getItem('bubiwot_user_password');
      const authUserId = userId || localStorage.getItem('bubiwot_user_id');

      if (!authSessionId && !authPassword && !authUserId) {
        setError('No session found');
        return;
      }

      const params = new URLSearchParams();
      if (authSessionId) params.append('sessionId', authSessionId);
      if (authPassword) params.append('password', authPassword);
      if (authUserId) params.append('userId', authUserId);
      // Pass the client-calculated accrued amount
      params.append('accruedAmount', accruedValue.toString());

      const response = await fetch(`/api/tokens/balance?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setBalanceData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching balance data:', err);
      setError('Failed to fetch balance data');
    }
  };

  const handleCollectClick = async () => {
    if (!clientCanCollect) return;
    
    setShowConfirmation(true);
    await fetchBalanceData();
  };

  const handleConfirmCollection = async () => {
    if (!balanceData || isCollecting) return;

    setIsCollecting(true);
    setError(null);
    
    console.log('🔵 Starting token collection process...');
    console.log('📋 Balance data:', balanceData);
    console.log('💰 Accrued value from props:', accruedValue);

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
        return;
      }

      // Success - notify parent and close confirmation
      console.log('✅ Collection successful!');
      console.log('💳 New balance from server:', data.newBalance);
      console.log('📊 Full server response:', data);
      
      if (onTokensCollected) {
        console.log('🔄 Calling onTokensCollected with balance:', data.newBalance);
        onTokensCollected(data.newBalance, data.lifetimeMetrics);
      } else {
        console.warn('⚠️ No onTokensCollected callback provided');
      }
      
      setShowConfirmation(false);
      console.log('🎉 Token collection process completed successfully');
    } catch (err) {
      console.error('💥 Error collecting tokens:', err);
      setError('Failed to collect tokens');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleCancelCollection = () => {
    setShowConfirmation(false);
    setBalanceData(null);
    setError(null);
  };

  // Confirmation Modal
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Collect Accrued Tokens
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {balanceData && (
            <div className="space-y-3 text-sm mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-medium text-blue-900 mb-2">Collection Summary</h4>
                <div className="space-y-1 text-blue-800">
                  <div className="flex justify-between">
                    <span>Accrued tokens:</span>
                    <span className="font-mono">¤{balanceData.accruedTokens.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection fee:</span>
                    <span className="font-mono text-red-600">-¤{balanceData.withdrawalCost.toFixed(2)}</span>
                  </div>
                  <hr className="border-blue-300" />
                  <div className="flex justify-between font-medium">
                    <span>Net collection:</span>
                    <span className="font-mono text-green-600">¤{(balanceData.accruedTokens - balanceData.withdrawalCost).toFixed(6)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                <div className="space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Current balance:</span>
                    <span className="font-mono">¤{(balanceData.user.credits || 0).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New balance:</span>
                    <span className="font-mono font-medium">¤{((balanceData.user.credits || 0) + (balanceData.accruedTokens - balanceData.withdrawalCost)).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current rate:</span>
                    <span className="font-mono">¤{balanceData.currentRate.toFixed(6)}/sec</span>
                  </div>
                </div>
              </div>
              
              {/* Lifetime Metrics Display */}
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <h4 className="font-medium text-purple-900 mb-2">Lifetime Metrics</h4>
                <div className="space-y-1 text-purple-800">
                  <div className="flex justify-between">
                    <span>Total allocated:</span>
                    <span className="font-mono">¤{balanceData.lifetimeMetrics.allocated.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total collected:</span>
                    <span className="font-mono">¤{balanceData.lifetimeMetrics.collected.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collections count:</span>
                    <span className="font-mono">{balanceData.lifetimeMetrics.collections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection rate:</span>
                    <span className="font-mono">{balanceData.lifetimeMetrics.collectionPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {!balanceData.canWithdraw && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="font-medium text-red-900 mb-1">Cannot Collect</h4>
                  <div className="text-red-800 text-sm">
                    {balanceData.accruedTokens < balanceData.minimumWithdrawal && (
                      <div>• Insufficient accrued tokens (need ¤{balanceData.minimumWithdrawal})</div>
                    )}
                    {(balanceData.user.credits || 0) < balanceData.withdrawalCost && (
                      <div>• Insufficient balance for collection fee</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancelCollection}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCollection}
              disabled={isCollecting || !balanceData?.canWithdraw}
              className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
                balanceData?.canWithdraw && !isCollecting
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCollecting ? 'Collecting...' : 'Confirm Collection'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main button
  return (
    <button
      onClick={handleCollectClick}
      disabled={!clientCanCollect}
      className={`px-3 py-2 text-xs rounded-md flex items-center transition-colors ${
        clientCanCollect
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      title={
        clientCanCollect
          ? `Collect accrued tokens (¤${accruedValue.toFixed(6)} - ¤0.01 fee)`
          : `Need ¤0.01 accrued (currently ¤${accruedValue.toFixed(6)})`
      }
    >
      {clientCanCollect ? '¤0.01' : '¤0.01'}
    </button>
  );
} 