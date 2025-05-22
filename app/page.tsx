"use client";
import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

// Generate a UUID (v4, lightweight)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format elapsed seconds as H:M:S
function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
}

// Accrual Meter component
function AccrualMeter({ elapsed }: { elapsed: number }) {
  const BASE_RATE = 0.0001; // ¤/sec, consistent with other components
  const MONTHLY_TARGET = 260; // ¤/month

  // Calculate current value and percentage
  const currentValue = elapsed * BASE_RATE;
  const progressPercentage = Math.min((currentValue / MONTHLY_TARGET) * 100, 100);
  
  // Format for display with hundredths precision
  const formattedValue = currentValue.toFixed(2);
  
  // Animation states
  const [animKey, setAnimKey] = useState(0);
  
  // Update animation key on each elapsed change
  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [elapsed]);

  return (
    <div className="w-full max-w-md mx-auto my-4 px-2">
      {/* Counter display */}
      <div className="text-center mb-2">
        <motion.div
          key={animKey}
          initial={{ opacity: 0.9, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="inline-block"
        >
          <span className="text-3xl font-bold text-gray-900">~¤{formattedValue}</span>
          <div className="text-xs text-gray-500 mt-1">Accrued value</div>
        </motion.div>
      </div>
      
      <div className="text-center mb-3">
        <button
          className="px-6 py-2 text-sm bg-gray-300 text-gray-700 rounded-md cursor-not-allowed"
          disabled
        >
          Send
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
        <div 
          className="h-4 rounded-full bg-gradient-to-r from-green-500 to-blue-600"
          style={{ 
            width: `${progressPercentage}%`, 
            transition: 'width 0.5s ease-out' 
          }}
        ></div>
      </div>
      <div className="text-center text-xs text-gray-600 mt-1">
        {progressPercentage.toFixed(1)}% of ¤{MONTHLY_TARGET} monthly target
      </div>
    </div>
  );
}

// Inflation Trend Dashboard component
function InflationTrendDashboard({ elapsed }: { elapsed: number }) {
  // Constants
  const BASE_RATE = 0.0001; // ¤/sec
  const DAYS_PROJECTION = 30;
  const SECONDS_IN_DAY = 86400;
  const APY = 0.03; // 3%
  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 140;
  const CHART_PADDING = 20;
  const DAILY_RATE = BASE_RATE * SECONDS_IN_DAY;
  
  // Colors
  const actualColor = "#2563eb"; // blue-600
  const projectedColor = "#9333ea"; // purple-600
  
  // Current accrued amount
  const accrued = elapsed * BASE_RATE;
  const formattedAccrued = accrued.toFixed(2);
  
  // Animation state for numeric display
  const [flash, setFlash] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  
  // Chart data state
  const [projectionData, setProjectionData] = useState<Array<{day: number, value: number}>>([]);
  const [actualData, setActualData] = useState<Array<{day: number, value: number}>>([]);
  const [maxValue, setMaxValue] = useState(0);
  
  // Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: number, 
    value: number,
    dailyGrowth: number,
    isProjected: boolean
  } | null>(null);
  
  // Effect for flashing animation on value change
  useEffect(() => {
    setFlash(true);
    setAnimKey((k) => k + 1);
    const timeout = setTimeout(() => setFlash(false), 200);
    return () => clearTimeout(timeout);
  }, [elapsed]);
  
  // Generate chart data with deterministic values
  useEffect(() => {
    // Generate projection data
    const newProjectionData = [];
    let currentValue = accrued;
    
    // Daily compound rate (APY converted to daily)
    const dailyRate = Math.pow(1 + APY, 1/365) - 1;
    
    // Start with current day
    newProjectionData.push({ day: 0, value: currentValue });
    
    // Project for next 30 days
    for (let day = 1; day <= DAYS_PROJECTION; day++) {
      // Add daily accrual
      currentValue += DAILY_RATE;
      
      // Apply compound interest
      currentValue *= (1 + dailyRate);
      
      newProjectionData.push({ day, value: currentValue });
    }
    
    // Generate actual data (deterministic variation)
    const newActualData = newProjectionData.map((point, index) => {
      // Create deterministic variation based on day number instead of random
      const variation = index === 0 ? 1 : 0.9 + (((point.day * 13) % 20) / 100);
      return {
        day: point.day,
        value: index === 0 ? point.value : point.value * variation
      };
    });
    
    // Find max value for scaling
    const newMaxValue = Math.max(
      ...newProjectionData.map(d => d.value),
      ...newActualData.map(d => d.value)
    ) * 1.1; // Add 10% headroom
    
    setProjectionData(newProjectionData);
    setActualData(newActualData);
    setMaxValue(newMaxValue);
  }, [elapsed, accrued, DAILY_RATE]);
  
  // Convert data points to SVG path
  const createPath = (data: { day: number, value: number }[]) => {
    if (data.length === 0) return "";
    
    const scaleX = (day: number) => CHART_PADDING + (day / DAYS_PROJECTION) * (CHART_WIDTH - 2 * CHART_PADDING);
    const scaleY = (value: number) => CHART_HEIGHT - CHART_PADDING - (value / maxValue) * (CHART_HEIGHT - 2 * CHART_PADDING);
    
    let path = `M ${scaleX(data[0].day)} ${scaleY(data[0].value)}`;
    
    for (let i = 1; i < data.length; i++) {
      path += ` L ${scaleX(data[i].day)} ${scaleY(data[i].value)}`;
    }
    
    return path;
  };
  
  // Create area fill for the chart
  const createAreaPath = (data: { day: number, value: number }[]) => {
    if (data.length === 0) return "";
    
    const scaleX = (day: number) => CHART_PADDING + (day / DAYS_PROJECTION) * (CHART_WIDTH - 2 * CHART_PADDING);
    const scaleY = (value: number) => CHART_HEIGHT - CHART_PADDING - (value / maxValue) * (CHART_HEIGHT - 2 * CHART_PADDING);
    
    let path = `M ${scaleX(data[0].day)} ${scaleY(data[0].value)}`;
    
    for (let i = 1; i < data.length; i++) {
      path += ` L ${scaleX(data[i].day)} ${scaleY(data[i].value)}`;
    }
    
    // Complete the area by adding bottom points
    path += ` L ${scaleX(data[data.length - 1].day)} ${CHART_HEIGHT - CHART_PADDING}`;
    path += ` L ${scaleX(data[0].day)} ${CHART_HEIGHT - CHART_PADDING} Z`;
    
    return path;
  };
  
  // Handle chart mouse movement for tooltips
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (projectionData.length === 0 || actualData.length === 0) return;
    
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    
    // Convert x position to day
    const day = Math.max(0, Math.min(DAYS_PROJECTION, 
      ((mouseX - CHART_PADDING) / (CHART_WIDTH - 2 * CHART_PADDING)) * DAYS_PROJECTION
    ));
    
    // Find closest day in data
    const closestDay = Math.round(day);
    const projectionPoint = projectionData.find(p => p.day === closestDay);
    const actualPoint = actualData.find(p => p.day === closestDay);
    
    if (!projectionPoint || !actualPoint) return;
    
    // Determine if we're closer to projection or actual line
    const scaleY = (value: number) => CHART_HEIGHT - CHART_PADDING - (value / maxValue) * (CHART_HEIGHT - 2 * CHART_PADDING);
    const projectionY = scaleY(projectionPoint.value);
    const actualY = scaleY(actualPoint.value);
    
    const mouseY = e.clientY - svgRect.top;
    const isProjected = Math.abs(mouseY - projectionY) < Math.abs(mouseY - actualY);
    
    const point = isProjected ? projectionPoint : actualPoint;
    
    // Calculate daily growth
    const prevDay = Math.max(0, closestDay - 1);
    const prevPoint = isProjected 
      ? projectionData.find(p => p.day === prevDay) 
      : actualData.find(p => p.day === prevDay);
    
    let dailyGrowth = 0;
    if (prevPoint && prevPoint.value > 0) {
      dailyGrowth = ((point.value - prevPoint.value) / prevPoint.value) * 100;
    }
    
    setHoveredPoint({
      day: point.day,
      value: point.value,
      dailyGrowth,
      isProjected
    });
  };
  
  // Handle chart mouse leave
  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  return (
    <div className="w-full bg-gray-50 rounded-lg p-3 p-4 my-4">
      <h3 className="text-sm font-medium text-gray-700">Inflation Trend Dashboard</h3>
      
      {/* Accrued amount with animation */}
      <div className="flex items-center justify-center my-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={animKey}
            initial={{ scale: 1 }}
            animate={{ scale: flash ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <div className="text-gray-600 text-xs">You&apos;ve accrued:</div>
            <div className={`text-2xl sm:text-3xl font-bold ${flash ? "text-blue-500" : "text-black"}`}>
              ¤{formattedAccrued}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Stats display outside chart */}
      {hoveredPoint && (
        <div className="flex flex-wrap justify-center gap-4 mb-2 text-xs">
          <div className="bg-white px-3 py-2 rounded-md shadow-sm">
            <span className="text-gray-500">Day:</span>
            <span className="ml-1 font-medium">{hoveredPoint.day}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-md shadow-sm">
            <span className="text-gray-500">Value:</span>
            <span className="ml-1 font-medium">¤{hoveredPoint.value.toFixed(2)}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-md shadow-sm">
            <span className="text-gray-500">Daily:</span>
            <span className="ml-1 font-medium">¤{DAILY_RATE.toFixed(4)}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-md shadow-sm">
            <span className="text-gray-500">Growth:</span>
            <span className={`ml-1 font-medium ${hoveredPoint.dailyGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {hoveredPoint.dailyGrowth > 0 ? '+' : ''}{hoveredPoint.dailyGrowth.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      
      {/* Projection chart */}
      <div className="relative bg-white rounded-md shadow-sm p-2">
        <svg 
          width={CHART_WIDTH} 
          height={CHART_HEIGHT} 
          className="w-full h-auto"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={handleChartMouseLeave}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line 
              key={`grid-y-${ratio}`}
              x1={CHART_PADDING} 
              y1={CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - 2 * CHART_PADDING)}
              x2={CHART_WIDTH - CHART_PADDING} 
              y2={CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - 2 * CHART_PADDING)}
              stroke="#e5e7eb" 
              strokeWidth="1" 
            />
          ))}
          
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line 
              key={`grid-x-${ratio}`}
              x1={CHART_PADDING + ratio * (CHART_WIDTH - 2 * CHART_PADDING)} 
              y1={CHART_PADDING}
              x2={CHART_PADDING + ratio * (CHART_WIDTH - 2 * CHART_PADDING)} 
              y2={CHART_HEIGHT - CHART_PADDING}
              stroke="#e5e7eb" 
              strokeWidth="1" 
            />
          ))}
          
          {/* X-axis */}
          <line 
            x1={CHART_PADDING} 
            y1={CHART_HEIGHT - CHART_PADDING} 
            x2={CHART_WIDTH - CHART_PADDING} 
            y2={CHART_HEIGHT - CHART_PADDING} 
            stroke="#9ca3af" 
            strokeWidth="1.5" 
          />
          
          {/* Y-axis */}
          <line 
            x1={CHART_PADDING} 
            y1={CHART_PADDING} 
            x2={CHART_PADDING} 
            y2={CHART_HEIGHT - CHART_PADDING} 
            stroke="#9ca3af" 
            strokeWidth="1.5" 
          />
          
          {/* X-axis labels */}
          <text x={CHART_PADDING} y={CHART_HEIGHT - 5} fontSize="10" fill="#6b7280" textAnchor="middle">0</text>
          <text x={CHART_WIDTH/2} y={CHART_HEIGHT - 5} fontSize="10" fill="#6b7280" textAnchor="middle">15</text>
          <text x={CHART_WIDTH - CHART_PADDING} y={CHART_HEIGHT - 5} fontSize="10" fill="#6b7280" textAnchor="middle">30</text>
          <text x={CHART_WIDTH/2} y={CHART_HEIGHT - CHART_PADDING + 15} fontSize="10" fill="#6b7280" textAnchor="middle">Days</text>
          
          {/* Y-axis labels */}
          {maxValue > 0 && [0, 0.5, 1].map((ratio) => (
            <text 
              key={`label-y-${ratio}`}
              x={CHART_PADDING - 5} 
              y={CHART_HEIGHT - CHART_PADDING - ratio * (CHART_HEIGHT - 2 * CHART_PADDING) + 3} 
              fontSize="10" 
              fill="#6b7280"
              textAnchor="end"
            >
              ¤{(maxValue * ratio).toFixed(2)}
            </text>
          ))}
          
          {/* Area fill for actual data */}
          <path 
            d={createAreaPath(actualData)} 
            fill={`${actualColor}15`} 
          />
          
          {/* Line for actual data */}
          <path 
            d={createPath(actualData)} 
            fill="none" 
            stroke={actualColor} 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
          
          {/* Dashed line for projection */}
          <path 
            d={createPath(projectionData)} 
            fill="none" 
            stroke={projectedColor} 
            strokeWidth="2" 
            strokeDasharray="4 2" 
          />
          
          {/* Hover point indicator */}
          {hoveredPoint && (
            <circle 
              cx={CHART_PADDING + (hoveredPoint.day / DAYS_PROJECTION) * (CHART_WIDTH - 2 * CHART_PADDING)}
              cy={CHART_HEIGHT - CHART_PADDING - (hoveredPoint.value / maxValue) * (CHART_HEIGHT - 2 * CHART_PADDING)}
              r="4" 
              fill={hoveredPoint.isProjected ? projectedColor : actualColor}
              stroke="white"
              strokeWidth="1.5"
            />
          )}
          
          {/* Legend */}
          <g transform={`translate(${CHART_WIDTH - 120}, 15)`}>
            <rect width="10" height="3" fill={actualColor} rx="1"/>
            <text x="15" y="4" fontSize="10" fill="#374151">Actual</text>
            
            <g transform="translate(0, 12)">
              <line x1="0" y1="1.5" x2="10" y2="1.5" stroke={projectedColor} strokeWidth="2" strokeDasharray="2 1" />
              <text x="15" y="4" fontSize="10" fill="#374151">Projected (3% APY)</text>
            </g>
          </g>
        </svg>
      </div>
      
      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 mt-2">
        Hover over chart to see detailed projections
      </div>
    </div>
  );
}

// Live USD Counter component
function LiveUsdCounter({ elapsed }: { elapsed: number }) {
  // Each second, increment by ¤0.0001
  const base = 0.0001;
  const earned = elapsed * base;
  // Format to 4 decimals, but animate last two
  const formatted = earned.toFixed(4);
  const [main, last2] = [formatted.slice(0, -2), formatted.slice(-2)];
  // Animation state
  const [flash, setFlash] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setFlash(true);
    setAnimKey((k) => k + 1);
    const timeout = setTimeout(() => setFlash(false), 200);
    return () => clearTimeout(timeout);
  }, [elapsed]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-xs text-gray-800 my-3 select-none">
      <div className="mb-1 text-xs text-gray-600">₿UBI:</div>
      <div className="flex items-center">
        <span className="font-mono text-sm font-medium text-gray-700 mr-0.5">¤</span>
        <span className="font-mono text-lg sm:text-xl font-semibold text-black">{main}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={animKey}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3, times: [0, 0.5, 1] }}
            className={`font-mono text-lg sm:text-xl font-semibold ml-0.5 ${flash ? "text-yellow-500" : "text-black"}`}
          >
            {last2}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// SVG Line Chart Component
function LineCharts({ elapsed }: { elapsed: number }) {
  // Constants
  const SECONDS = 300; // 5 min window
  const USER_RATE = 0.0001; // ¤/sec
  const ECOSYSTEM_RATE = 0.001; // ¤/sec (example, can be changed)
  const INFLATION = 0.03; // 3% annual
  const WIDTH = 180;
  const HEIGHT = 80;
  const PADDING = 24;
  // Colors
  const userColor = "#2563eb"; // blue-600
  const ecoColor = "#f59e42"; // orange-400
  // Data arrays
  const [userData, setUserData] = useState<{ t: number; v: number }[]>([]);
  const [ecoData, setEcoData] = useState<{ t: number; v: number }[]>([]);
  // Track max values to create a fixed scale
  const [maxValues, setMaxValues] = useState({ user: 0, eco: 0 });

  // Inflation factor per second
  const inflationPerSec = Math.pow(1 + INFLATION, 1 / (365 * 24 * 3600));

  // On each tick, add new data point
  useEffect(() => {
    if (elapsed === 0) {
      setUserData([]);
      setEcoData([]);
      setMaxValues({ user: 0, eco: 0 });
      return;
    }

    setUserData(prevUserData => {
      const lastPointV = prevUserData.length > 0 ? prevUserData[prevUserData.length - 1].v : 0;
      const nextUserValue = (lastPointV + USER_RATE) * inflationPerSec;
      
      setMaxValues(currentMaxVals => {
        if (nextUserValue > currentMaxVals.user) {
          return { ...currentMaxVals, user: nextUserValue };
        }
        return currentMaxVals;
      });
      
      const newPoint = { t: elapsed, v: nextUserValue };
      let updatedUserData;
      if (prevUserData.length === 0 && elapsed > 0) {
           // Add an initial point at t=0 (or t=elapsed-1) if this is the first data point after reset
           updatedUserData = [{t: Math.max(0, elapsed -1) , v:0}, newPoint];
      } else {
          updatedUserData = [...prevUserData, newPoint];
      }
      return updatedUserData.length > SECONDS ? updatedUserData.slice(-SECONDS) : updatedUserData;
    });

    setEcoData(prevEcoData => {
      const lastPointV = prevEcoData.length > 0 ? prevEcoData[prevEcoData.length - 1].v : 0;
      const nextEcoValue = (lastPointV + ECOSYSTEM_RATE) * inflationPerSec;

      setMaxValues(currentMaxVals => {
        if (nextEcoValue > currentMaxVals.eco) {
          return { ...currentMaxVals, eco: nextEcoValue };
        }
        return currentMaxVals;
      });

      const newPoint = { t: elapsed, v: nextEcoValue };
      let updatedEcoData;
       if (prevEcoData.length === 0 && elapsed > 0) {
          // Add an initial point at t=0 (or t=elapsed-1) if this is the first data point after reset
          updatedEcoData = [{t: Math.max(0, elapsed -1), v:0}, newPoint];
      } else {
          updatedEcoData = [...prevEcoData, newPoint];
      }
      return updatedEcoData.length > SECONDS ? updatedEcoData.slice(-SECONDS) : updatedEcoData;
    });
  }, [elapsed, inflationPerSec]); // Added inflationPerSec to the dependency array

  // Helper: format time
  function fmt(t: number) {
    const d = new Date(t * 1000);
    return d.toISOString().substr(11, 8);
  }

  // Helper: get min/max for Y axis with safety checks
  function getYRange(data: { v: number }[], isUserData: boolean) {
    // Always use 0 as minimum
    const min = 0;
    
    // Use tracked max values instead of calculating from current visible data
    // This ensures we show the true exponential growth without auto-scaling
    // Add 30% headroom to show growth room
    const maxValue = isUserData ? maxValues.user : maxValues.eco;
    const max = maxValue * 1.3 || 1; // Default to 1 if maxValue is 0
    
    return [min, max];
  }

  // Helper: build SVG path with cubic interpolation
  function buildPath(data: { t: number; v: number }[], color: string) {
    if (data.length < 2) return ""; // Need at least 2 points
    
    // Filter out invalid data points
    const validData = data.filter(d => !isNaN(d.t) && !isNaN(d.v) && isFinite(d.t) && isFinite(d.v));
    if (validData.length < 2) return "";
    
    const [minY, maxY] = getYRange(validData, color === userColor);
    const minT = validData[0].t;
    const maxT = validData[validData.length - 1].t;
    
    // Avoid division by zero
    const timeRange = maxT - minT || 1;
    const valueRange = maxY - minY || 1;
    
    const scaleX = (t: number) => PADDING + ((t - minT) / timeRange) * (WIDTH - 2 * PADDING);
    const scaleY = (v: number) => HEIGHT - PADDING - ((v - minY) / valueRange) * (HEIGHT - 2 * PADDING);
    
    let d = `M${scaleX(validData[0].t)},${scaleY(validData[0].v)}`;
    
    for (let i = 1; i < validData.length; i++) {
      const p0 = validData[i - 1], p1 = validData[i];
      const cpx = (scaleX(p0.t) + scaleX(p1.t)) / 2;
      d += ` C${cpx},${scaleY(p0.v)} ${cpx},${scaleY(p1.v)} ${scaleX(p1.t)},${scaleY(p1.v)}`;
    }
    
    return d;
  }

  // Helper: build gradient fill path
  function buildFill(data: { t: number; v: number }[], color: string) {
    if (data.length < 2) return ""; // Need at least 2 points
    
    // Filter out invalid data points
    const validData = data.filter(d => !isNaN(d.t) && !isNaN(d.v) && isFinite(d.t) && isFinite(d.v));
    if (validData.length < 2) return "";
    
    const [minY, maxY] = getYRange(validData, color === userColor);
    const minT = validData[0].t;
    const maxT = validData[validData.length - 1].t;
    
    // Avoid division by zero
    const timeRange = maxT - minT || 1;
    const valueRange = maxY - minY || 1;
    
    const scaleX = (t: number) => PADDING + ((t - minT) / timeRange) * (WIDTH - 2 * PADDING);
    const scaleY = (v: number) => HEIGHT - PADDING - ((v - minY) / valueRange) * (HEIGHT - 2 * PADDING);
    
    let d = `M${scaleX(validData[0].t)},${scaleY(validData[0].v)}`;
    
    for (let i = 1; i < validData.length; i++) {
      const p0 = validData[i - 1], p1 = validData[i];
      const cpx = (scaleX(p0.t) + scaleX(p1.t)) / 2;
      d += ` C${cpx},${scaleY(p0.v)} ${cpx},${scaleY(p1.v)} ${scaleX(p1.t)},${scaleY(p1.v)}`;
    }
    
    // Close path to bottom
    d += ` L${scaleX(validData[validData.length - 1].t)},${HEIGHT - PADDING}`;
    d += ` L${scaleX(validData[0].t)},${HEIGHT - PADDING} Z`;
    
    return d;
  }

  // Y axis ticks
  function yTicks(data: { v: number }[], isUserData: boolean) {
    if (data.length < 2) return [0, 0.5, 1]; // Default ticks for empty data
    
    const [minY, maxY] = getYRange(data, isUserData);
    return [minY, (minY + maxY) / 2, maxY];
  }

  // X axis ticks (show 3: left, center, right)
  function xTicks(data: { t: number }[]) {
    if (data.length < 2) return [0, 0, 0]; // Default ticks for empty data
    
    const minT = data[0].t;
    const maxT = data[data.length - 1].t;
    return [minT, (minT + maxT) / 2, maxT];
  }

  // Create a memoized version of the Chart component to prevent unnecessary re-renders
  const MemoizedChart = React.memo(function Chart({ 
    data, 
    color, 
    label
  }: { 
    data: { t: number; v: number }[]; 
    color: string; 
    label: string;
  }) {
    // Early return for empty chart with placeholder
    if (data.length < 2) {
      return (
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="bg-white rounded shadow-sm">
          <text x={WIDTH/2 - 30} y={HEIGHT/2} fontSize="10" fill="#888">Collecting data...</text>
          <g>
            <rect x={WIDTH-70} y={6} width={8} height={8} rx={2} fill={color} />
            <text x={WIDTH-58} y={13} fontSize="10" fill="#222">{label}</text>
            <text x={WIDTH-58} y={22} fontSize="8" fill="#888">+3%/yr</text>
          </g>
        </svg>
      );
    }
    
    // Make a safe copy to prevent rendering issues
    const safeData = data.filter(d => !isNaN(d.t) && !isNaN(d.v) && isFinite(d.t) && isFinite(d.v));
    
    // Safety check
    if (safeData.length < 2) {
      return (
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="bg-white rounded shadow-sm">
          <text x={WIDTH/2 - 30} y={HEIGHT/2} fontSize="10" fill="#888">Collecting data...</text>
          <g>
            <rect x={WIDTH-70} y={6} width={8} height={8} rx={2} fill={color} />
            <text x={WIDTH-58} y={13} fontSize="10" fill="#222">{label}</text>
            <text x={WIDTH-58} y={22} fontSize="8" fill="#888">+3%/yr</text>
          </g>
        </svg>
      );
    }
    
    const isUserData = label === "You";
    const [minY, maxY] = getYRange(safeData, isUserData);
    const minT = safeData[0].t;
    const maxT = safeData[safeData.length - 1].t;
    
    // Avoid division by zero
    const timeRange = maxT - minT || 1;
    const valueRange = maxY - minY || 1;
    
    const scaleX = (t: number) => PADDING + ((t - minT) / timeRange) * (WIDTH - 2 * PADDING);
    const scaleY = (v: number) => HEIGHT - PADDING - ((v - minY) / valueRange) * (HEIGHT - 2 * PADDING);
    
    return (
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="bg-white rounded shadow-sm">
        {/* Gradient */}
        <defs>
          <linearGradient id={label+"-grad"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Fill */}
        <path d={buildFill(safeData, color)} fill={`url(#${label}-grad)`} />
        {/* Line */}
        <path d={buildPath(safeData, color)} fill="none" stroke={color} strokeWidth="2.5" />
        {/* Y axis ticks */}
        {yTicks(safeData, isUserData).map((y, i) => (
          <text key={i} x={2} y={scaleY(y) + 4} fontSize="8" fill="#888">{y.toFixed(2)}</text>
        ))}
        {/* X axis ticks */}
        {xTicks(safeData).map((t, i) => (
          <text key={i} x={scaleX(t) - 12} y={HEIGHT - 2} fontSize="8" fill="#888">{fmt(t)}</text>
        ))}
        {/* Legend */}
        <g>
          <rect x={WIDTH-70} y={6} width={8} height={8} rx={2} fill={color} />
          <text x={WIDTH-58} y={13} fontSize="10" fill="#222">{label}</text>
          <text x={WIDTH-58} y={22} fontSize="8" fill="#888">+3%/yr</text>
        </g>
      </svg>
    );
  });

  // Responsive layout: stack on mobile, side-by-side on desktop
  return (
    <div className="w-full my-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Real-time Growth Charts</h3>
      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
        <div className="w-full sm:w-1/2">
          <MemoizedChart data={userData} color={userColor} label="You" />
        </div>
        <div className="w-full sm:w-1/2">
          <MemoizedChart data={ecoData} color={ecoColor} label="Ecosystem" />
        </div>
      </div>
    </div>
  );
}

// YouTube Video Card Component (refactored for props and mobile design)
const YouTubeVideoCard = React.memo(function YouTubeVideoCard({ title, videoId, link, isShort }: { title: string; videoId: string; link: string; isShort?: boolean }) {
  const [isLoading, setIsLoading] = useState(true);
  // Shorts use a different embed URL
  const embedUrl = isShort
    ? `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0&showinfo=0&controls=1&loop=0&playlist=${videoId}`
    : `https://www.youtube.com/embed/${videoId}`;
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-6 flex flex-col border border-gray-100">
      <div className="aspect-video w-full bg-gray-100 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        <iframe
          className="w-full h-full absolute top-0 left-0"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-3">
        <div className="font-semibold text-base text-gray-900 text-center mb-1 leading-tight">{title}</div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline text-center break-all"
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  );
});

// Video Section with two videos, mobile-optimized
function VideoSection() {
  return (
    <section id="video" className="px-2 sm:px-4 py-8 bg-gray-50">
      <h2 className="text-lg font-bold mb-4 text-black text-center">Featured Videos</h2>
      <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
        <YouTubeVideoCard
          title="social x economic identity"
          videoId="AEoTS5U-KeI"
          link="https://www.youtube.com/shorts/AEoTS5U-KeI"
          isShort={true}
        />
        <YouTubeVideoCard
          title="Bitcoin UBI Playbook (wip)"
          videoId="WbbIzGQcGdU"
          link="https://www.youtube.com/watch?v=WbbIzGQcGdU"
        />
      </div>
    </section>
  );
}

// Login Modal Component
function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/account/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: loginPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user data in localStorage
      localStorage.setItem('bubiwot_user_id', data.userId);
      localStorage.setItem('bubiwot_user_alias', data.alias);
      localStorage.setItem('bubiwot_user_password', loginPassword);
      
      // Reload to update UI
      window.location.reload();
      
      setLoginPassword("");
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Login</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="recoveryKey" className="block text-sm font-medium text-gray-700 mb-1">
              Recovery Key / Password
            </label>
            <input
              type="password"
              id="recoveryKey"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter your key"
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Recover Account"
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-3 text-center">
          Account recovery is under development.
        </p>
      </div>
    </div>
  );
}

// User Modal Component
function UserModal({ 
  isOpen, 
  onClose, 
  userData, 
  onLogin, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onLogout 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  userData: {
    userId: string;
    alias: string;
    password: string;
    hasLoggedIn: boolean;
  };
  onLogin: (password: string) => void;
  _onLogout: () => void; // Update the interface to match
}) {
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [localPassword, setLocalPassword] = useState("");
  
  // Animation for strobing effect
  const [isStrobing, setIsStrobing] = useState(false);
  
  // Set up strobing animation if user hasn't logged in
  useEffect(() => {
    if (!userData.hasLoggedIn && isOpen) {
      const interval = setInterval(() => {
        setIsStrobing(prev => !prev);
      }, 700); // Toggle every 700ms
      
      return () => clearInterval(interval);
    }
  }, [userData.hasLoggedIn, isOpen]);
  
  // Update local password when userData changes
  useEffect(() => {
    if (userData.password) {
      setLocalPassword(userData.password);
    }
  }, [userData.password]);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      await onLogin(loginPassword);
      setLoginPassword("");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(localPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      
      // Fallback method if clipboard API fails
      const textArea = document.createElement("textarea");
      textArea.value = localPassword;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
        alert("Failed to copy to clipboard. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };
  
  const handleRandomizePassword = async () => {
    try {
      const response = await fetch('/api/account/create', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.password) {
        setLocalPassword(data.password);
      }
    } catch (error) {
      console.error("Failed to randomize password:", error);
    }
  };
  
  const handleClearPassword = () => {
    setLocalPassword("");
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        {/* User Info Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <span className="text-sm font-medium text-gray-600 col-span-1">User ID:</span>
            <span className="text-sm text-gray-800 col-span-3 font-mono break-all">{userData.userId}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <span className="text-sm font-medium text-gray-600 col-span-1">Alias:</span>
            <span className="text-sm text-gray-800 col-span-3">{userData.alias}</span>
          </div>
          
          {/* Password section with buttons */}
          <div className={`rounded p-2 ${!userData.hasLoggedIn && isStrobing ? 'bg-yellow-100' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Password:</span>
              <div className="flex gap-1">
                <button 
                  onClick={handleRandomizePassword}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
                  title="Generate new password"
                >
                  <span>🔄</span>
                </button>
                <button 
                  onClick={handleCopyPassword}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center min-w-[60px]"
                  title="Copy to clipboard"
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
                <button 
                  onClick={handleClearPassword}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
                  title="Clear password"
                >
                  <span>✕</span>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-800 font-mono break-all bg-white p-2 rounded border border-gray-200 min-h-[2.5rem]">
              {localPassword}
            </div>
          </div>
          
          {!userData.hasLoggedIn && (
            <div className="mt-3 text-xs text-yellow-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              This account has never been used to login
            </div>
          )}
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login with Password
            </label>
            <div className={`flex ${!userData.hasLoggedIn && isStrobing ? 'bg-yellow-100' : ''} rounded`}>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoggingIn || !loginPassword}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-blue-300"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Finance Dashboard component
function FinanceDashboard({ elapsed }: { elapsed: number }) {
  return (
    <>
      {/* Live USD Counter */}
      <LiveUsdCounter elapsed={elapsed} />
      
      {/* Accrual Meter */}
      <AccrualMeter elapsed={elapsed} />
      
      {/* Mobile-Optimized Layout Container for financial charts */}
      <div className="w-full max-w-md mx-auto">
        {/* Inflation Trend Dashboard */}
        <InflationTrendDashboard elapsed={elapsed} />
        
        {/* Side-by-side SVG Line Charts */}
        <LineCharts elapsed={elapsed} />
      </div>
    </>
  );
}

export default function Home() {
  // Mock data
  const [userCount, setUserCount] = useState(0);
  const [totalBubi] = useState("???");
  const [tasks] = useState([
    { id: 1, title: "Verify your humanity" },
    { id: 2, title: "Invite a friend" },
    { id: 3, title: "Join Discord! Let's talk about Bitcoin UBI" },
  ]);
  const [messages] = useState([
    { id: 1, text: "for free speech", name: "Bobby", total_sats: 1000000 },
  ]);

  // Session ID and timer logic
  const [, setSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [alias, setAlias] = useState("anon");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  
  // On mount, initialize session ID and start time from localStorage or set new
  useEffect(() => {
    let sid = localStorage.getItem('bubiwot_session_id');
    let sstart = localStorage.getItem('bubiwot_session_start');
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem('bubiwot_session_id', sid);
    }
    if (!sstart) {
      sstart = Date.now().toString();
      localStorage.setItem('bubiwot_session_start', sstart);
    }
    setSessionId(sid);
    setSessionStart(Number(sstart));
    
    // Check if user is logged in
    const storedUserId = localStorage.getItem('bubiwot_user_id');
    const storedAlias = localStorage.getItem('bubiwot_user_alias');
    const storedPassword = localStorage.getItem('bubiwot_user_password');
    const storedHasLoggedIn = localStorage.getItem('bubiwot_user_has_logged_in');
    
    if (storedUserId && storedAlias && storedPassword) {
      setUserId(storedUserId);
      setAlias(storedAlias);
      setUserPassword(storedPassword);
      setHasLoggedIn(storedHasLoggedIn === 'true');
      setIsLoggedIn(true);
    }
    
    // Fetch user count
    fetchUserCount();
  }, []);
  
  // Fetch user count
  const fetchUserCount = async () => {
    try {
      const response = await fetch('/api/account/count');
      if (response.ok) {
        const data = await response.json();
        setUserCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch user count:", error);
    }
  };

  // Timer interval
  useEffect(() => {
    if (!sessionStart) return;
    const update = () => setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleGeneratePassword = async () => {
    setIsPasswordLoading(true);
    setPasswordInput("");
    setUserId(null);
    setAlias("anon");
    
    try {
      const response = await fetch('/api/account/create', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.password && data.userId) {
        setPasswordInput(data.password);
        setUserId(data.userId);
        if (data.alias) {
          setAlias(data.alias);
        }
        // Set hasLoggedIn to false for new accounts
        setHasLoggedIn(false);
        setShowPasswordInput(true);
      }
    } catch (error) {
      console.error("Failed to generate password:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Could not generate password."}`);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleRandomizePassword = async () => {
    try {
      const response = await fetch('/api/account/create', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.password) {
        setPasswordInput(data.password);
        setUserId(data.userId);
        if (data.alias) {
          setAlias(data.alias);
        }
      }
    } catch (error) {
      console.error("Failed to randomize password:", error);
    }
  };
  
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(passwordInput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      
      // Fallback method if clipboard API fails
      const textArea = document.createElement("textarea");
      textArea.value = passwordInput;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed:", err);
        alert("Failed to copy to clipboard. Please copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };
  
  const handleCreateWithExistingPassword = async () => {
    if (!importPassword.trim()) {
      alert("Please enter a password");
      return;
    }
    
    setIsCreatingAccount(true);
    
    try {
      const response = await fetch('/api/account/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: importPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      setPasswordInput(data.password);
      setUserId(data.userId);
      if (data.alias) {
        setAlias(data.alias);
      }
      
      // Store user data in localStorage
      localStorage.setItem('bubiwot_user_id', data.userId);
      localStorage.setItem('bubiwot_user_alias', data.alias);
      localStorage.setItem('bubiwot_user_password', data.password);
      localStorage.setItem('bubiwot_user_has_logged_in', 'false'); // New account hasn't logged in yet
      
      setImportPassword("");
      setIsLoggedIn(true);
      setUserPassword(data.password);
      setHasLoggedIn(false);
      
      // Refresh user count
      fetchUserCount();
      
      alert(`Account created successfully! User ID: ${data.userId}`);
    } catch (error) {
      console.error("Failed to create account:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Could not create account."}`);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleClosePasswordInput = () => {
    setShowPasswordInput(false);
  };
  
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('bubiwot_user_id');
    localStorage.removeItem('bubiwot_user_alias');
    localStorage.removeItem('bubiwot_user_password');
    localStorage.removeItem('bubiwot_user_has_logged_in');
    
    // Reset state
    setUserId(null);
    setAlias("anon");
    setUserPassword("");
    setHasLoggedIn(false);
    setIsLoggedIn(false);
    
    // Close modal if open
    setShowUserModal(false);
  };

  // Stub functions
  const donate = (id: number) => alert(`Donate to message ${id}!`);
  const viewAllMessages = () => alert("View all messages coming soon!");
  const openDiscord = () => window.open("https://discord.gg/WGFvG8vv", "_blank");
  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  const handleLoginFromModal = async (password: string) => {
    try {
      const response = await fetch('/api/account/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Update localStorage
      localStorage.setItem('bubiwot_user_id', data.userId);
      localStorage.setItem('bubiwot_user_alias', data.alias);
      localStorage.setItem('bubiwot_user_password', password);
      localStorage.setItem('bubiwot_user_has_logged_in', 'true');
      
      // Update state
      setUserId(data.userId);
      setAlias(data.alias);
      setUserPassword(password);
      setHasLoggedIn(true);
      setIsLoggedIn(true);
      
      // Close modal
      setShowUserModal(false);
      
      // Show success message
      alert("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const openUserModal = () => setShowUserModal(true);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-extralight tracking-wider text-gray-600">Bitcoin UBI Web-of-Trust</span>
        <div className="ml-auto">
          {!isLoggedIn ? (
            <button onClick={openLoginModal} className="text-sm text-blue-600 hover:underline">
              Login
            </button>
          ) : (
            <button 
              onClick={openUserModal} 
              className="text-sm text-green-600 hover:underline cursor-pointer"
            >
              {alias}
            </button>
          )}
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Whitepaper Link Banner */}
        <div className="w-full bg-blue-50 py-3 px-4 text-center border-b border-blue-100">
          <div className="text-blue-600 font-medium text-base">
           <Link href="/protowhitepaper/" className="text-blue-700 hover:underline">docs/whitepaper</Link>
          </div>
        </div>
        
        {/* User Info Section - Removed as requested */}
        
        {/* Hero Section */}
        <section id="hero" className="px-4 py-8 flex flex-col items-center text-center">
          {/* Account Label */}
          <div className="w-full flex justify-center mb-1">
            <div className="bg-purple-100 text-purple-800 text-xs font-medium rounded-full px-3 py-1 shadow-sm">
              {userId ? alias : "New Account"}
            </div>
          </div>
          
          {/* Session Timer and User Count */}
          <div className="w-full flex flex-col items-center gap-1 mb-2">
            <div className="bg-gray-100 text-xs text-gray-800 rounded-full px-3 py-1 shadow-sm min-w-[120px] max-w-xs truncate">
              Session: {formatElapsed(elapsed)}
            </div>
            <div className="text-xs text-gray-700">
              Users: {userCount}
            </div>
          </div>
          
          {/* Beta Notice Section - Hide if account has logged in */}
          {(!isLoggedIn || !hasLoggedIn) && (
            <div className="w-full max-w-md mx-auto bg-red-50 p-3 rounded-lg my-3 border border-red-200">
              <div className="w-full flex justify-center mb-1">
                <span className="block text-red-600 text-xs font-medium">Beta: Your Identity/Account is not yet saved permanently without manual steps.</span>
              </div>
              <div className="w-full flex justify-center mb-2">
                <span className="block text-red-600 text-xs">All accounts may be reset during beta - this will happen often :)</span>
              </div>
              
              {!showPasswordInput ? (
                <div className="w-full flex justify-center">
                  {/* <button
                    onClick={handleGeneratePassword}
                    disabled={isPasswordLoading}
                    className="px-4 py-2 text-sm bg-yellow-400 text-black rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isPasswordLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      "Save & Copy Password"
                    )}
                  </button> */}
                </div>
              ) : (
                <div className="w-full">
                  <div className="text-left mb-1">
                    <label className="block text-sm font-medium text-gray-700">Password:</label>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 text-black"
                    />
                    <button
                      onClick={handleCopyPassword}
                      className="px-2 py-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 min-w-[60px]"
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleRandomizePassword}
                      className="px-2 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      🔄
                    </button>
                    <button
                      onClick={handleClosePasswordInput}
                      className="px-2 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-left mt-1 text-xs text-gray-600">
                    <span>Alias: {alias}</span>
                  </div>
                  
                  {/* Create Account with existing password section */}
                  <div className="mt-4 pt-3 border-t border-red-200">
                    <div className="text-left mb-1">
                      <label className="block text-sm font-medium text-gray-700">Password?:</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={importPassword}
                        onChange={(e) => setImportPassword(e.target.value)}
                        placeholder="Paste an existing password"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-300 text-black"
                      />
                      <button
                        onClick={handleCreateWithExistingPassword}
                        disabled={isCreatingAccount}
                        className="whitespace-nowrap px-3 py-2 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center"
                      >
                        {isCreatingAccount ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Finance Dashboard Component */}
          <FinanceDashboard elapsed={elapsed} />
          
          
          <h1 className="text-2xl font-bold text-black mt-4">You are earning Bitcoin UBI Now 💪</h1>
          <p className="text-sm text-black mt-2">We&apos;re working to let you cash out in BTC! 👷</p>
          <button
            className="px-8 mx-auto bg-gray-400 text-white rounded-lg py-3 mt-4 font-semibold text-base cursor-not-allowed"
            disabled
          >
            <span className="line-through">Cash Out</span> <span>(Coming Soon)</span>
          </button>
          <div className="flex w-full justify-center gap-6 mt-3">
            <div className="flex items-center gap-1">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a4 4 0 0 0-3-3.87"/>
                <path d="M9 20H4v-2a4 4 0 0 1 3-3.87"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-xs text-black">Joined</span>
              <span className="ml-1 font-semibold text-xs text-black">{userCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 13a4 4 0 1 0-8 0v5a4 4 0 1 0 8 0v-5z"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-xs text-black">Total</span>
              <span className="ml-1 font-semibold text-xs text-black">{totalBubi} BUBI</span>
            </div>
          </div>
        </section>

        {/* Video Section (replaces old video section) */}
        <VideoSection />

        {/* Quick Tasks */}
        <section id="tasks" className="px-4 py-8">
          <h2 className="text-lg font-bold mb-3 text-black">Get Involved</h2>
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className={`flex items-center bg-gray-100 rounded-lg px-3 py-2 ${task.title.includes("Join Discord") ? "cursor-pointer hover:bg-gray-200" : ""}`}
                onClick={task.title.includes("Join Discord") ? openDiscord : undefined}
              >
                <span className="flex-1 text-sm text-black">{task.title}</span>
                {task.title.includes("Join Discord") && (
                  <svg 
                    className="h-5 w-5 mr-2 text-indigo-500" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.39-.444.906-.608 1.31a16.98 16.98 0 0 0-5.092 0c-.164-.404-.4-.92-.61-1.31a.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.49a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055c1.994 1.465 3.922 2.355 5.803 2.945a.082.082 0 0 0 .089-.028c.39-.53.739-1.09 1.039-1.675a.075.075 0 0 0-.041-.106 11.95 11.95 0 0 1-1.708-.817.075.075 0 0 1-.007-.125c.114-.086.228-.176.336-.267a.075.075 0 0 1 .079-.01c3.954 1.809 8.232 1.809 12.143 0a.075.075 0 0 1 .08.01c.108.091.222.182.337.267a.075.075 0 0 1-.007.125c-.545.308-1.113.588-1.709.818a.075.075 0 0 0-.041.106c.305.581.654 1.142 1.038 1.675a.076.076 0 0 0 .089.028c1.88-.59 3.809-1.48 5.804-2.945a.077.077 0 0 0 .03-.055c.5-5.177-.838-9.596-3.549-13.442a.06.06 0 0 0-.031-.027zM8.02 15.278c-1.144 0-2.089-1.055-2.089-2.345 0-1.29.924-2.344 2.089-2.344 1.174 0 2.09 1.064 2.074 2.344 0 1.29-.925 2.345-2.075 2.345zm7.676 0c-1.145 0-2.09-1.055-2.09-2.345 0-1.29.925-2.344 2.09-2.344 1.174 0 2.09 1.064 2.073 2.344 0 1.29-.925 2.345-2.074 2.345z"/>
                  </svg>
                )}
                <div className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded transition cursor-default">
                  Reward: 0 BUBI
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Leaderboard */}
        <section id="leaderboard" className="px-4 py-8 bg-gray-50">
          <h2 className="text-lg font-bold mb-3 text-black">Top Donors</h2>
          <ul className="flex flex-col gap-2">
            {messages.slice(0, 5).map((msg, i) => (
              <li key={msg.id} className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm">
                <span className="w-8 text-center text-xs font-bold text-black">{i + 1}</span>
                <span className="flex-1 text-sm truncate text-black">
                  <span className="italic">&quot;{msg.text}&quot;</span>
                  <span className="ml-2 text-xs text-gray-600">&mdash;{msg.name}</span>
                </span>
                <button
                  className="ml-2 px-3 py-1 text-xs bg-yellow-400 text-black rounded hover:bg-yellow-300 transition"
                  onClick={() => donate(msg.id)}
                >
                  {msg.total_sats >= 1000000 
                    ? `${(msg.total_sats / 1000000).toFixed(1)}M` 
                    : msg.total_sats} sats
                </button>
              </li>
            ))}
          </ul>
          <button
            className="w-full mt-2 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition text-black"
            onClick={viewAllMessages}
          >
            View All
          </button>
        </section>

        {/* Footer */}
        <footer className="px-4 py-8 flex flex-col items-center text-center gap-2">
          <div className="flex gap-4 mb-2">
            <a className="text-blue-600 underline text-sm" href="mailto:bobby@formulax.dev">bobby@formulax.dev</a>
            <button onClick={openLoginModal} className="text-sm text-blue-600 hover:underline">
              Login / Recover Account
            </button>
          </div>
          <span className="text-xs text-gray-800 mt-2">© 2025 BUBIWOT Protocol</span>
          <span className="text-xs text-gray-700 mt-1">
            Donate BTC: bc1q2hcaje8l7uzsc2jdfhe3svfczy3mlxeuvuet8h
          </span>
        </footer>
      </main>
      <Analytics />
      <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
      <UserModal 
        isOpen={showUserModal} 
        onClose={() => setShowUserModal(false)} 
        userData={{
          userId: userId || "",
          alias,
          password: userPassword,
          hasLoggedIn
        }}
        onLogin={handleLoginFromModal}
        _onLogout={handleLogout} // Add this prop to pass the logout function
      />
    </div>
  );
}
