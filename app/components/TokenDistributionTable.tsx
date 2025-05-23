"use client";

import { useState, useEffect } from 'react';

type DistributionDataPoint = {
  id: string;
  timestamp: string;
  totalIssued: string;
  totalBurned: string;
  circulating: string;
};

export default function TokenDistributionTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataPoints, setDataPoints] = useState<DistributionDataPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch historical distribution data
  const fetchDistributionData = async () => {
    try {
      // Fetch the most recent global balance records
      const response = await fetch('/api/global-balance/history?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch token distribution data');
      }
      
      const data = await response.json();
      setDataPoints(data.history || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching distribution data:', err);
      setError('Failed to load token distribution data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchDistributionData();
    
    // Update data every 10 seconds
    const interval = setInterval(() => {
      fetchDistributionData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Format a decimal number for display
  const formatDecimal = (value: string, decimals = 8) => {
    try {
      const num = parseFloat(value);
      return num.toFixed(decimals);
    } catch {
      return value;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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

  if (dataPoints.length === 0) {
    return (
      <div className="w-full bg-gray-50 rounded-lg p-4 my-4">
        <p className="text-gray-600 text-center">No token distribution data available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 rounded-lg p-4 my-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">Token Distribution History</h3>
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-medium">Time</th>
              <th className="py-2 px-3 text-right text-xs font-medium">Total Issued</th>
              <th className="py-2 px-3 text-right text-xs font-medium">Total Burned</th>
              <th className="py-2 px-3 text-right text-xs font-medium">Circulating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dataPoints.map((point) => (
              <tr key={point.id} className="hover:bg-gray-50">
                <td className="py-2 px-3 text-xs text-gray-800">
                  {formatDate(point.timestamp)}
                </td>
                <td className="py-2 px-3 text-xs text-right font-mono text-blue-600">
                  {formatDecimal(point.totalIssued)}
                </td>
                <td className="py-2 px-3 text-xs text-right font-mono text-red-600">
                  {formatDecimal(point.totalBurned)}
                </td>
                <td className="py-2 px-3 text-xs text-right font-mono text-green-600">
                  {formatDecimal(point.circulating)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        Showing last {dataPoints.length} distribution updates
      </div>
    </div>
  );
} 