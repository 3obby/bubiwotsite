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

export default function TokenDistributionMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<GlobalBalanceData | null>(null);
  const [projection, setProjection] = useState<ProjectionData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch global balance data
  const fetchGlobalBalance = async () => {
    try {
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
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchGlobalBalance();
    
    // Update data every 10 seconds as requested
    const interval = setInterval(() => {
      fetchGlobalBalance();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 rounded-lg p-4 my-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (!balance || !projection) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4">
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
    <div className="w-full bg-gray-50 rounded-lg p-4 my-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Global Token Distribution</h3>
      
      {/* Last updated timestamp */}
      <div className="text-xs text-gray-500 mb-3">
        Last updated: {lastUpdated?.toLocaleTimeString()}
      </div>
      
      {/* Current balance stats */}
      <div className="bg-white rounded-md shadow-sm p-3 mb-4 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-gray-500">Total Issued</div>
          <div className="text-md font-semibold text-blue-600">
            {formatNumber(balance.totalIssued, 2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Circulating</div>
          <div className="text-md font-semibold text-green-600">
            {formatNumber(balance.circulating, 2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Total Burned</div>
          <div className="text-md font-semibold text-red-600">
            {formatNumber(balance.totalBurned, 2)}
          </div>
        </div>
      </div>
      
      {/* Projection minimap */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-3">
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
            <div className="w-2 h-2 bg-purple-500 rounded-full mb-1" />
            <div className="text-xs text-gray-600">{projection.targetYear}</div>
          </div>
        </div>
        
        {/* Distribution stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Per Human</div>
            <div className="text-sm font-semibold text-gray-800">
              {formatNumber(projection.tokensPerHuman)} Tokens
            </div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-xs text-gray-500">Target Population</div>
            <div className="text-sm font-semibold text-gray-800">
              {formatNumber(projection.totalHumans)} Humans
            </div>
          </div>
        </div>
      </div>
      
      {/* Info text */}
      <p className="text-xs text-gray-500 text-center">
        Projecting distribution of {formatNumber(projection.tokensPerHuman)} tokens per human to
        {' '}{formatNumber(projection.totalHumans)} humans by {projection.targetYear}
        {' '}({projection.yearsRemaining} years remaining)
      </p>
    </div>
  );
} 