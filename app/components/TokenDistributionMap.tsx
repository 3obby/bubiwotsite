"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type GlobalBalanceData = {
  id: string;
  totalIssued: string;
  totalBurned: string;
  circulating: string;
  timestamp: string;
};

type ProjectionData = {
  totalProjected: number;
  tokensPerHuman: number;
  totalHumans: number;
  targetYear: number;
  yearsRemaining: number;
  percentComplete: number;
};

// Enhanced loading spinner component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
  );
};

export default function TokenDistributionMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<GlobalBalanceData | null>(null);
  const [projection, setProjection] = useState<ProjectionData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch global balance data
  const fetchGlobalBalance = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      
      const response = await fetch('/api/global-balance');
      if (!response.ok) {
        throw new Error('Failed to fetch global balance data');
      }
      
      const data = await response.json();
      setBalance(data.balance);
      setProjection(data.projection);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching global balance:', err);
      setError('Failed to load global token data');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchGlobalBalance(true);
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchGlobalBalance();
    
    // Update data every 10 seconds as requested
    const interval = setInterval(() => {
      if (isLiveUpdating) {
        fetchGlobalBalance();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLiveUpdating]);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4 animate-fadeIn">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-gray-600">Loading global token data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 my-4 animate-slideDown">
        <div className="flex items-center justify-between">
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="ml-2 text-red-600 hover:text-red-800 underline disabled:opacity-50"
          >
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!balance || !projection) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4 animate-fadeIn">
        <p className="text-gray-600 text-center">No token distribution data available</p>
      </div>
    );
  }

  // Format numbers for display
  const formatNumber = (num: number | string, decimals = 0) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(decimals)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(decimals)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(decimals)}K`;
    }
    
    return value.toFixed(decimals);
  };

  // For very large numbers, use scientific notation
  const formatLargeNumber = (num: number | string) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
    
    return formatNumber(value);
  };

  // Calculate current year for timeline
  const currentYear = new Date().getFullYear();

  // Animation for the progress bar
  const progressBarVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${Math.min(projection.percentComplete, 100)}%`,
      transition: { duration: 1, ease: "easeOut" }
    }
  };

  return (
    <div className="w-full bg-gray-50 rounded-lg p-4 my-4 animate-slideUp">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Global Token Distribution</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-all"
            title="Refresh data"
          >
            {isRefreshing ? (
              <div className="flex items-center gap-1">
                <LoadingSpinner size="sm" />
                <span>Refreshing...</span>
              </div>
            ) : (
              '↻ Refresh'
            )}
          </button>
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
      
      {/* Last updated timestamp */}
      <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
        <span>Last updated: {lastUpdated?.toLocaleTimeString()}</span>
        {isLiveUpdating && (
          <span className="text-green-600 animate-pulse">●</span>
        )}
      </div>
      
      {/* Current balance stats */}
      <div className="bg-white rounded-md shadow-sm p-3 mb-4 grid grid-cols-3 gap-2 animate-fadeIn">
        <div className="text-center">
          <div className="text-xs text-gray-500">Total Issued</div>
          <div className="text-md font-semibold text-blue-600 transition-all">
            {formatNumber(balance.totalIssued, 2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Circulating</div>
          <div className="text-md font-semibold text-green-600 transition-all">
            {formatNumber(balance.circulating, 2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Total Burned</div>
          <div className="text-md font-semibold text-red-600 transition-all">
            {formatNumber(balance.totalBurned, 2)}
          </div>
        </div>
      </div>
      
      {/* Projection minimap */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-3 animate-fadeIn">
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs font-medium text-gray-700">
            Projected Distribution: {formatLargeNumber(projection.totalProjected)} Tokens
          </div>
          <div className="text-xs text-gray-500">
            {projection.percentComplete.toFixed(6)}% Complete
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            variants={progressBarVariants}
            initial="initial"
            animate="animate"
          />
        </div>
        
        {/* Timeline */}
        <div className="relative w-full h-8 mb-2">
          {/* Timeline line */}
          <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200" />
          
          {/* Start year */}
          <div className="absolute left-0 top-0 flex flex-col items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mb-1" />
            <div className="text-xs text-gray-600">{currentYear}</div>
          </div>
          
          {/* Current progress marker */}
          <div 
            className="absolute top-0 flex flex-col items-center"
            style={{ 
              left: `${Math.min(projection.percentComplete / 100 * 100, 100)}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-3 h-3 bg-green-500 rounded-full mb-1 animate-pulse" />
            <div className="text-xs text-green-600 font-semibold">Now</div>
          </div>
          
          {/* Target year */}
          <div className="absolute right-0 top-0 flex flex-col items-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mb-1" />
            <div className="text-xs text-gray-600">{projection.targetYear}</div>
          </div>
        </div>
        
        {/* Distribution details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-gray-500">Tokens per Human</div>
            <div className="font-semibold text-gray-700">
              {formatNumber(projection.tokensPerHuman)}
            </div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-gray-500">Target Population</div>
            <div className="font-semibold text-gray-700">
              {formatLargeNumber(projection.totalHumans)}
            </div>
          </div>
        </div>
        
        {/* Years remaining */}
        <div className="mt-3 text-center">
          <div className="text-xs text-gray-500">Years Remaining</div>
          <div className="text-lg font-bold text-blue-600">
            {projection.yearsRemaining.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
} 