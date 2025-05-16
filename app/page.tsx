"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function Home() {
  // Mock data
  const [userCount] = useState("???");
  const [totalBubi] = useState("???");
  const [tasks] = useState([
    { id: 1, title: "Verify your humanity" },
    { id: 2, title: "Invite a friend" },
    { id: 3, title: "Join Discord" },
  ]);
  const [messages] = useState([
    { id: 1, text: "for free speech", name: "Bobby", total_sats: 1000000 },
  ]);

  // Session ID and timer logic
  const [, setSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Generate a UUID (v4, lightweight)
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

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
  }, []);

  // Timer interval
  useEffect(() => {
    if (!sessionStart) return;
    const update = () => setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Format elapsed seconds as H:M:S
  function formatElapsed(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
  }

  // Stub functions
  const donate = (id: number) => alert(`Donate to message ${id}!`);
  const viewAllMessages = () => alert("View all messages coming soon!");
  const openDiscord = () => window.open("https://discord.gg/WGFvG8vv", "_blank");

  // Accrual Meter component
  function AccrualMeter({ elapsed }: { elapsed: number }) {
    const BASE_RATE = 0.0001; // $/sec, consistent with other components
    const MONTHLY_TARGET = 260; // $/month

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
            <span className="text-3xl font-bold text-gray-900">~${formattedValue}</span>
            <div className="text-xs text-gray-500 mt-1">Accrued value</div>
          </motion.div>
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
          {progressPercentage.toFixed(1)}% of ${MONTHLY_TARGET} monthly target
        </div>
      </div>
    );
  }

  // Inflation Trend Dashboard component
  function InflationTrendDashboard({ elapsed }: { elapsed: number }) {
    // Constants
    const BASE_RATE = 0.0001; // $/sec
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
                ${formattedAccrued}
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
              <span className="ml-1 font-medium">${hoveredPoint.value.toFixed(2)}</span>
            </div>
            <div className="bg-white px-3 py-2 rounded-md shadow-sm">
              <span className="text-gray-500">Daily:</span>
              <span className="ml-1 font-medium">${DAILY_RATE.toFixed(4)}</span>
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
                ${(maxValue * ratio).toFixed(2)}
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
    // Each second, increment by $0.0001
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
        <div className="mb-1 text-xs text-gray-600">Your Bitcoin UBI Earned:</div>
        <div className="flex items-center">
          <span className="font-mono text-lg sm:text-xl font-semibold text-black">$</span>
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
    const USER_RATE = 0.0001; // $/sec
    const ECOSYSTEM_RATE = 0.001; // $/sec (example, can be changed)
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-extralight tracking-wider text-gray-600">BUBIWOT</span>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Whitepaper Link Banner */}
        <div className="w-full bg-blue-50 py-3 px-4 text-center border-b border-blue-100">
          <a 
            href="https://bubiwot.gitbook.io/bubiwot/supporting-research/proposed-table-of-contents-research-direction"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-medium hover:underline text-base"
          >
            read the whitepaper: @https://bubiwot.gitbook.io/bubiwot/supporting-research/proposed-table-of-contents-research-direction
          </a>
        </div>
        
        {/* Hero Section */}
        <section id="hero" className="px-4 py-8 flex flex-col items-center text-center">
          {/* Session Timer Bar */}
          <div className="w-full flex justify-center mb-2">
            <div className="bg-gray-100 text-xs text-gray-800 rounded-full px-3 py-1 shadow-sm min-w-[120px] max-w-xs truncate">
              Session: {formatElapsed(elapsed)}
            </div>
          </div>
          {/* Beta Notice */}
          <div className="w-full flex justify-center mb-2">
            <span className="block text-red-500 text-xs">Beta: Your Identity/Account is not yet saved</span>
          </div>
          <div className="w-full flex justify-center mb-2">
            <span className="block text-red-500 text-xs">Beta: This is a vision I, Bobby, am building towards in open collaboration</span>
          </div>
          
          {/* Live USD Counter */}
          <LiveUsdCounter elapsed={elapsed} />
          
          {/* Accrual Meter (NEW) */}
          <AccrualMeter elapsed={elapsed} />
          
          {/* Mobile-Optimized Layout Container */}
          <div className="w-full max-w-md mx-auto">
            {/* Inflation Trend Dashboard */}
            <InflationTrendDashboard elapsed={elapsed} />
            
            {/* Side-by-side SVG Line Charts */}
            <LineCharts elapsed={elapsed} />
          </div>
          
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
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 0 0-3-3.87"/><path d="M9 20H4v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="text-xs text-black">Joined</span>
              <span className="ml-1 font-semibold text-xs text-black">{userCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 13a4 4 0 1 0-8 0v5a4 4 0 1 0 8 0v-5z"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="text-xs text-black">Distributed</span>
              <span className="ml-1 font-semibold text-xs text-black">{totalBubi} BUBI</span>
            </div>
          </div>
        </section>

        {/* Video Intro */}
        <section id="video" className="px-4 py-8 bg-gray-50">
          <h2 className="text-lg font-bold mb-3 text-black">What is BUBIWOT?</h2>
          <div className="w-full rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center" style={{ height: 180 }}>
            <span className="text-gray-600 font-medium">Video coming soon</span>
          </div>
        </section>

        {/* Quick Tasks */}
        <section id="tasks" className="px-4 py-8">
          <h2 className="text-lg font-bold mb-3 text-black">Get Involved</h2>
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-black">{task.title}</span>
                <div className="ml-2 px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded transition cursor-default">
                  Reward coming soon
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
            <button className="text-blue-600 underline text-sm" onClick={openDiscord}>Join Discord</button>
            <a className="text-blue-600 underline text-sm" href="mailto:bobby@formulax.dev">Email: bobby@formulax.dev</a>
          </div>
          <span className="text-xs text-gray-800 mt-2">© 2025 BUBIWOT Protocol</span>
   
            Donate BTC: bc1q2hcaje8l7uzsc2jdfhe3svfczy3mlxeuvuet8h
      
        </footer>
      </main>
    </div>
  );
}
