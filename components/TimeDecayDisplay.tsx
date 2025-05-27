'use client';

import React, { useState, useEffect } from 'react';
import { formatTimeRemaining, calculateReclaimableStake } from '@/lib/timeDecay';

interface TimeDecayDisplayProps {
  postId: string;
  authorId?: string | null;
  currentUserId?: string;
  stake: number;
  donatedValue: number;
  effectiveValue: number;
  createdAt: Date;
  expiresAt: Date | null;
  lastDonationAt?: Date;
  onReclaim?: (amount: number) => void;
  userPassword?: string;
  sessionId?: string;
}

export default function TimeDecayDisplay({
  postId,
  authorId,
  currentUserId,
  stake,
  donatedValue,
  effectiveValue,
  createdAt,
  expiresAt,
  lastDonationAt,
  onReclaim,
  userPassword,
  sessionId
}: TimeDecayDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [reclaimableAmount, setReclaimableAmount] = useState<number>(0);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclaimError, setReclaimError] = useState<string | null>(null);

  // Update countdown timer every minute
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(expiresAt));
      
      // Calculate reclaimable amount if user owns this post
      if (authorId === currentUserId && stake > 0) {
        const reclaimData = calculateReclaimableStake(
          stake,
          donatedValue,
          createdAt,
          lastDonationAt
        );
        setReclaimableAmount(reclaimData.totalReclaim);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, authorId, currentUserId, stake, donatedValue, createdAt, lastDonationAt]);

  const handleReclaim = async () => {
    if (!authorId || authorId !== currentUserId || reclaimableAmount <= 0.001) {
      return;
    }

    setIsReclaiming(true);
    setReclaimError(null);

    try {
      const response = await fetch('/api/posts/reclaim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          userId: currentUserId,
          password: userPassword,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reclaim stake');
      }

      // Notify parent component of successful reclaim
      if (onReclaim) {
        onReclaim(data.reclaimedAmount);
      }

      // Reset reclaimable amount since it's been claimed
      setReclaimableAmount(0);

    } catch (error) {
      console.error('Error reclaiming stake:', error);
      setReclaimError(error instanceof Error ? error.message : 'Failed to reclaim stake');
    } finally {
      setIsReclaiming(false);
    }
  };

  const isExpired = expiresAt && expiresAt.getTime() <= Date.now();
  const canReclaim = authorId === currentUserId && reclaimableAmount > 0.001;

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Time remaining display */}
      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
        <span className="text-xs">⏱</span>
        <span className={isExpired ? 'font-medium' : ''}>
          {timeRemaining}
        </span>
      </div>

      {/* Effective value display */}
      <div className="flex items-center gap-1 text-gray-600">
        <span className="text-xs">📊</span>
        <span>¤{effectiveValue.toFixed(3)}</span>
      </div>

      {/* Reclaim button for post authors */}
      {canReclaim && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleReclaim}
            disabled={isReclaiming}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isReclaiming ? 'Reclaiming...' : `Reclaim ¤${reclaimableAmount.toFixed(3)}`}
          </button>
        </div>
      )}

      {/* Error display */}
      {reclaimError && (
        <div className="text-xs text-red-600">
          {reclaimError}
        </div>
      )}

      {/* Decay info tooltip */}
      <div className="group relative">
        <span className="text-xs text-gray-400 cursor-help">ℹ</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <div>Stake: ¤{stake.toFixed(3)}</div>
          <div>Donations: ¤{donatedValue.toFixed(3)}</div>
          <div>Effective: ¤{effectiveValue.toFixed(3)}</div>
          {canReclaim && (
            <div className="text-green-300">Reclaimable: ¤{reclaimableAmount.toFixed(3)}</div>
          )}
        </div>
      </div>
    </div>
  );
} 