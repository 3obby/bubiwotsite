"use client";
// Test comment
import React, { useState, useEffect, FormEvent, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";

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

// Profile Modal Component
function ProfileModal({ 
  isOpen, 
  onClose, 
  userData, 
  onUpdateAlias,
  onSwitchAccount
}: { 
  isOpen: boolean; 
  onClose: () => void;
  userData: {
    userId: string;
    alias: string;
    credits: number;
  };
  onUpdateAlias: (newAlias: string) => Promise<void>;
  onSwitchAccount: (password: string) => Promise<void>;
}) {
  const [newAlias, setNewAlias] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [isUpdatingAlias, setIsUpdatingAlias] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setNewAlias("");
      setSwitchPassword("");
      setError(null);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleUpdateAlias = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim()) {
      setError("Please enter a new name");
      return;
    }
    
    // Make sure we have credits data
    if ((userData.credits || 0) < 10) {
      setError("Not enough credits. You need 10 credits to change your name.");
      return;
    }
    
    setIsUpdatingAlias(true);
    setError(null);
    
    try {
      await onUpdateAlias(newAlias);
      setNewAlias("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsUpdatingAlias(false);
    }
  };
  
  const handleSwitchAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (!switchPassword.trim()) {
      setError("Please enter a password");
      return;
    }
    
    // Make sure we have credits data
    if ((userData.credits || 0) < 1) {
      setError("Not enough credits. You need 1 credit to switch accounts.");
      return;
    }
    
    setIsSwitchingAccount(true);
    setError(null);
    
    try {
      await onSwitchAccount(switchPassword);
      setSwitchPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch account");
    } finally {
      setIsSwitchingAccount(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Change Name Form */}
        <form onSubmit={handleUpdateAlias} className="mb-6">
          <h3 className="text-md font-medium mb-2 text-gray-700">Change Name</h3>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Current Name: <span className="font-medium">{userData.alias}</span></label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="New name"
                className="flex-1 px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isUpdatingAlias || !newAlias.trim() || (userData.credits || 0) < 10}
                className="whitespace-nowrap px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
              >
                {isUpdatingAlias ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>¤10</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Changing your name costs 10 credits</p>
          </div>
        </form>
        
        {/* Switch Account Form */}
        <form onSubmit={handleSwitchAccount}>
          <h3 className="text-md font-medium mb-2 text-gray-700">Switch Account</h3>
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="password"
                value={switchPassword}
                onChange={(e) => setSwitchPassword(e.target.value)}
                placeholder="Account password"
                className="flex-1 px-3 py-2 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSwitchingAccount || !switchPassword.trim() || (userData.credits || 0) < 1}
                className="whitespace-nowrap px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
              >
                {isSwitchingAccount ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Switching...
                  </>
                ) : (
                  <>¤1</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Switching accounts costs 1 credit</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  // Mock data
  const [userCount] = useState(0);
  const [totalBubi] = useState("???");
  const [tasks] = useState([
    { id: 1, title: "Invite a friend" },
    { id: 2, title: "Join Discord" },
  ]);
  const [messages] = useState([
    { id: 1, text: " 💪", name: "Bobby", total_sats: 1000000 },
  ]);

  // Session ID and timer logic
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [alias, setAlias] = useState("anon");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [importPassword, setImportPassword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCopied, setIsCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [credits, setCredits] = useState(0.000777); // Default to 0.000777 credits
  const [totalBurnedCredits, setTotalBurnedCredits] = useState(0);
  const [accruedValue, setAccruedValue] = useState(0);
  const [isTokenEconomicsOpen, setIsTokenEconomicsOpen] = useState(false); // New state for token economics accordion
  const [showGlobalDistribution, setShowGlobalDistribution] = useState(false);
  const [saveLog, setSaveLog] = useState<string | null>(null); // New state for operation log
  const [saveSuccess, setSaveSuccess] = useState(false); // New state for save success
  const [isInflationMetricsOpen, setIsInflationMetricsOpen] = useState(false); // New state for inflation metrics accordion
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null); // User creation timestamp
  const [userUpdatedAt, setUserUpdatedAt] = useState<Date | null>(null); // User last update timestamp
  
  // Global token metrics state
  const [globalTokenMetrics, setGlobalTokenMetrics] = useState<{
    totalIssued: number;
    circulating: number;
    totalBurned: number;
    lastUpdated: Date;
    distributionProgress: number;
    tokensPerHuman?: number;
    targetPopulation?: number;
    distributionTimeframe?: string;
  }>({
    totalIssued: 0,
    circulating: 0,
    totalBurned: 0,
    lastUpdated: new Date(),
    distributionProgress: 0,
    tokensPerHuman: 1000000,
    targetPopulation: 10000000000,
    distributionTimeframe: '2025-2035'
  });
  
  // Token distribution history
  const [tokenDistributionHistory, setTokenDistributionHistory] = useState<Array<{
    time: Date;
    totalIssued: number;
    totalBurned: number;
    circulating: number;
  }>>([]);
  
  // Network status tracking
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  
  // Function to fetch burned credits
  const fetchBurnedCredits = useCallback(async () => {
    try {
      console.log('Fetching burned credits...');
      const response = await fetch('/api/account/burned-credits');
      if (!response.ok) {
        throw new Error(`Failed to fetch burned credits: ${response.status}`);
      }
      
      const data = await response.json();
      setTotalBurnedCredits(data.totalBurned || 0);
      
      // Update global metrics based on burned credits if the metrics API fails
      if (!globalTokenMetrics.lastUpdated) {
        const totalIssued = 100000000; // Placeholder for total issued
        const totalBurned = data.totalBurned || 0;
        const circulating = totalIssued - totalBurned;
        
        setGlobalTokenMetrics({
          totalIssued,
          circulating,
          totalBurned,
          lastUpdated: new Date(),
          distributionProgress: (totalIssued / 10000000000000) * 100, // 10,000T tokens target
          tokensPerHuman: 1000000,
          targetPopulation: 10000000000,
          distributionTimeframe: '2025-2035'
        });
        
        // Add to history if we don't have any entries yet
        if (tokenDistributionHistory.length === 0) {
          setTokenDistributionHistory([
            {
              time: new Date(),
              totalIssued,
              totalBurned,
              circulating
            }
          ]);
        }
      }
      
      console.log('Burned credits fetched:', data.totalBurned);
    } catch (error) {
      console.error('Error fetching burned credits:', error);
    }
  }, [globalTokenMetrics.lastUpdated, tokenDistributionHistory.length]);
  
  // Check network status function
  const checkNetworkStatus = useCallback(async () => {
    const startTime = Date.now();
    setNetworkStatus('checking');
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        setNetworkStatus('online');
        setLastResponseTime(responseTime);
      } else {
        setNetworkStatus('offline');
        setLastResponseTime(null);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Network check failed:', error);
      setNetworkStatus('offline');
      setLastResponseTime(null);
      setLastChecked(new Date());
    }
  }, []);

  // Initialize session and fetch data on component mount
  useEffect(() => {
    // Try to load user data from localStorage
    const storedUserId = localStorage.getItem('bubiwot_user_id');
    const storedAlias = localStorage.getItem('bubiwot_user_alias');
    const storedPassword = localStorage.getItem('bubiwot_user_password');
    const storedHasLoggedIn = localStorage.getItem('bubiwot_user_has_logged_in') === 'true';
    
    if (storedUserId && storedAlias && storedPassword) {
      setUserId(storedUserId);
      setAlias(storedAlias);
      setUserPassword(storedPassword);
      setHasLoggedIn(storedHasLoggedIn);
      setIsLoggedIn(true);
      
      // Fetch current credits for this user
      fetchUserCredits(storedUserId);
    }
    
    // Initialize or get session start time
    const storedSessionStart = localStorage.getItem('bubiwot_session_start');
    const now = Date.now();
    
    if (storedSessionStart) {
      const sessionStartTime = parseInt(storedSessionStart, 10);
      setSessionStart(sessionStartTime);
      setElapsed(Math.floor((now - sessionStartTime) / 1000));
    } else {
      localStorage.setItem('bubiwot_session_start', now.toString());
      setSessionStart(now);
      setElapsed(0);
    }
    
    // Generate session ID if not exists
    if (!localStorage.getItem('bubiwot_session_id')) {
      localStorage.setItem('bubiwot_session_id', uuidv4());
    }
    
    // Fetch initial data
    fetchBurnedCredits();
  }, [fetchBurnedCredits]);

  // Timer interval
  useEffect(() => {
    if (!sessionStart) return;
    
    const update = () => {
      const newElapsed = Math.floor((Date.now() - sessionStart) / 1000);
      setElapsed(newElapsed);
      // Calculate accrued value based on elapsed time
      // Base rate of 0.0001 per second
      setAccruedValue(newElapsed * 0.0001);
    };
    
    update(); // Initial update
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Network status checking effect
  useEffect(() => {
    // Initial check
    checkNetworkStatus();
    
    // Set up periodic checking every 30 seconds
    const interval = setInterval(checkNetworkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [checkNetworkStatus]);

  // Close network stats dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNetworkStats && !(event.target as Element).closest('[data-network-stats]')) {
        setShowNetworkStats(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNetworkStats]);

  // Implement handleUpdateAlias function for ProfileModal
  const handleUpdateAlias = async (newAlias: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/account/update-alias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newAlias }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alias');
      }
      
      // Update state with new alias and credits
      setAlias(data.alias);
      setCredits(data.credits);
      
      // Update in localStorage
      localStorage.setItem('bubiwot_user_alias', data.alias);
      
      // Refresh burned credits
      fetchBurnedCredits();
      
      alert(`Name updated successfully to ${data.alias}`);
    } catch (error) {
      console.error("Failed to update alias:", error);
      throw error;
    }
  };
  
  // Implement handleSwitchAccount function for ProfileModal
  const handleSwitchAccount = async (password: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/account/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch account');
      }
      
      // Update state with new user data
      setUserId(data.userId);
      setAlias(data.alias);
      setUserPassword(data.password);
      setHasLoggedIn(data.hasLoggedIn);
      setCredits(data.credits);
      setIsLoggedIn(true);
      
      // Update in localStorage
      localStorage.setItem('bubiwot_user_id', data.userId);
      localStorage.setItem('bubiwot_user_alias', data.alias);
      localStorage.setItem('bubiwot_user_password', data.password);
      localStorage.setItem('bubiwot_user_has_logged_in', 'true');
      
      // Refresh burned credits
      fetchBurnedCredits();
      
      // Close the profile modal
      setShowProfileModal(false);
      
      alert(`Switched to account: ${data.alias}`);
    } catch (error) {
      console.error("Failed to switch account:", error);
      throw error;
    }
  };
  
  // Handle manual save of tokens (costs 0.1 tokens)
  const handleManualSave = async () => {
    if (!userId || accruedValue < 0.1) {
      return;
    }
    
    setSaveLog('');
    setSaveSuccess(false);
    
    try {
      const response = await fetch('/api/account/manual-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          secondsElapsed: elapsed,
          sessionId: localStorage.getItem('bubiwot_session_id') || uuidv4(),
          saveTime: new Date().toISOString(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save account');
      }
      
      // Update credits state with new value
      setCredits(data.credits);
      
      // Set the operation log
      setSaveLog(JSON.stringify(data.log, null, 2));
      setSaveSuccess(true);
      
      // Reset session start to now so accrued value resets
      const newSessionStart = Date.now();
      localStorage.setItem('bubiwot_session_start', newSessionStart.toString());
      setSessionStart(newSessionStart);
      setElapsed(0);
      setAccruedValue(0);
      
      // Refresh burned credits after saving
      fetchBurnedCredits();
      
      // Dispatch custom event to notify listeners that a manual save was completed
      window.dispatchEvent(new CustomEvent('manual-save-complete'));
    } catch (err) {
      console.error("Failed to save account:", err);
      setSaveLog(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setSaveSuccess(false);
    }
  };
  
  const openUserModal = () => setShowUserModal(true);
  
  // Utility functions
  const openDiscord = () => window.open("https://discord.gg/WGFvG8vv", "_blank");
  const donate = (id: number) => alert(`Donate to message ${id}!`);
  const viewAllMessages = () => alert("View all messages coming soon!");
  const closeLoginModal = () => setShowLoginModal(false);
  
  // Login and account management
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
      setShowLoginModal(false);
      
      // Fetch user credits
      fetchUserCredits(data.userId);
      
      // Show success message
      alert("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('bubiwot_user_id');
    localStorage.removeItem('bubiwot_session_id');
    localStorage.removeItem('bubiwot_session_start');
    setUserId('');
    setUserPassword('');
    setAlias('');
    setCredits(0);
    setIsLoggedIn(false);
    setHasLoggedIn(false);
    setSessionStart(Date.now());
    setElapsed(0);
    setAccruedValue(0);
    setUserCreatedAt(null);
    setUserUpdatedAt(null);
  };
  
  // Fetch user credits
  const fetchUserCredits = async (uid: string) => {
    try {
      console.log(`Fetching credits for user ${uid}...`);
      const response = await fetch(`/api/account/get-credits?userId=${uid}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`User data updated:`, data);
        setCredits(data.credits);
        setAlias(data.alias);
        setHasLoggedIn(data.hasLoggedIn);
        setUserCreatedAt(new Date(data.createdAt));
        setUserUpdatedAt(new Date(data.updatedAt));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Failed to fetch user data: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extralight tracking-wider text-gray-600">Bitcoin UBI Web-of-Trust</span>
          <span className="text-xs font-medium text-red-500">beta</span>
          
          {/* Network Status Indicator */}
          <div className="relative" data-network-stats>
            <button
              onClick={() => setShowNetworkStats(!showNetworkStats)}
              className="flex items-center hover:bg-gray-100 rounded-full p-1 transition-colors"
              title={`Network status: ${networkStatus}`}
            >
              <div 
                className={`w-2 h-2 rounded-full transition-colors ${
                  networkStatus === 'online' ? 'bg-green-500' :
                  networkStatus === 'offline' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`}
              />
            </button>
            
            {/* Network Stats Dropdown */}
            {showNetworkStats && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
                <div className="text-xs font-medium text-gray-700 mb-2">Network Status</div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      networkStatus === 'online' ? 'text-green-600' :
                      networkStatus === 'offline' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {networkStatus}
                    </span>
                  </div>
                  {lastResponseTime && (
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-medium">{lastResponseTime}ms</span>
                    </div>
                  )}
                  {lastChecked && (
                    <div className="flex justify-between">
                      <span>Last Checked:</span>
                      <span className="font-medium">{lastChecked.toLocaleTimeString()}</span>
                    </div>
                  )}
                  <div className="pt-1 mt-2 border-t border-gray-100">
                    <button
                      onClick={checkNetworkStatus}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Check Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="ml-auto">
          {!isLoggedIn ? (
            <Link href="/protowhitepaper/" className="text-sm text-blue-600 hover:underline">
              docs/whitepaper
            </Link>
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
        {/* Whitepaper Link Banner - Removed */}
        
        {/* Hero Section */}
        <section id="hero" className="px-4 py-8 flex flex-col items-start">
          {/* User Stats Panel - Redesigned and Left-aligned */}
          <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            
            <div className="space-y-2">
              {/* Alias */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Name:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{alias}</span>
                </div>
              </div>
              
              {/* User ID */}
              {userId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ID:</span>
                  <span className="text-sm font-mono text-gray-700 truncate max-w-[200px]">{userId}</span>
                </div>
              )}
              
              {/* Base Credits (stored in database) */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Saved Credits:</span>
                <span className="text-sm font-medium text-blue-600">¤{credits.toFixed(8)}</span>
              </div>
              
              {/* Password (hidden with toggle) */}
              {userPassword && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Password:</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        // Toggle password visibility with proper type casting
                        const passwordField = document.getElementById('user-password') as HTMLInputElement;
                        if (passwordField) {
                          passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
                        }
                      }}
                      className="text-gray-500 hover:text-gray-700"
                      title="Toggle visibility"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <input 
                      id="user-password"
                      type="password" 
                      value={userPassword} 
                      readOnly 
                      className="text-sm font-mono bg-transparent border-none w-24 focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(userPassword);
                        // You could add a small toast notification here
                      }}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Credits with real-time calculation */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total:</span>
                <motion.span 
                  key={Math.floor(elapsed / 10)} // Update animation every 10 seconds
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-medium text-green-600"
                >
                  ~¤{(credits + accruedValue).toFixed(8)}
                </motion.span>
              </div>
              
              {/* My Income Rate - Collapsible Section */}
              <div className="mt-1 border-t border-gray-100 pt-1">
                <button 
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setIsInflationMetricsOpen(!isInflationMetricsOpen)}
                >
                  <h4 className="text-xs font-medium text-gray-700">My Income Rate</h4>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-gray-500 transition-transform ${isInflationMetricsOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={`mt-2 text-xs bg-gray-50 rounded-md transition-all ${isInflationMetricsOpen ? 'block' : 'hidden'}`}
                >
                  {/* Real-time Accrual Display */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                    <div>
                      <span className="text-xs text-gray-700 font-medium">Accruing:</span>
                      <div className="text-lg font-mono text-blue-600 font-semibold">
                        <motion.span
                          key={elapsed} // Update animation every second
                          initial={{ opacity: 0.7, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          ~¤{(credits + accruedValue).toFixed(8)}
                        </motion.span>
                      </div>
                      <div className="text-xs text-gray-500">¤0.0001/second</div>
                    </div>
                    <button
                      onClick={handleManualSave}
                      disabled={true}
                      className="px-3 py-2 text-xs bg-gray-300 text-gray-500 rounded-md cursor-not-allowed flex items-center"
                    >
                      Save (disabled)
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="p-3 border-t border-gray-200">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                      <div 
                        className="h-4 rounded-full bg-gradient-to-r from-green-500 to-blue-600"
                        style={{ 
                          width: `${Math.min(((credits + accruedValue) / 260) * 100, 100)}%`, 
                          transition: 'width 0.5s ease-out' 
                        }}
                      ></div>
                    </div>
                    <div className="text-center text-xs text-gray-600 mt-1">
                      {(Math.min(((credits + accruedValue) / 260) * 100, 100)).toFixed(1)}% of ¤260 monthly target
                    </div>
                  </div>

                  {/* Global View - Collapsible Subsection */}
                  <div className="p-3 border-t border-gray-200">
                    <button 
                      type="button"
                      className="flex items-center justify-between w-full text-left mb-2"
                      onClick={() => setShowGlobalDistribution(!showGlobalDistribution)}
                    >
                      <h5 className="text-xs font-medium text-gray-600">Global View</h5>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-3 w-3 text-gray-400 transition-transform ${showGlobalDistribution ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div 
                      className={`transition-all ${showGlobalDistribution ? 'block' : 'hidden'}`}
                    >
                
                    </div>
                  </div>

                  {/* Operation Log */}
                  {saveLog && (
                    <div className="m-3 p-2 bg-gray-100 rounded-md border border-gray-200 text-xs font-mono overflow-auto max-h-40">
                      <div className="font-medium text-gray-700 mb-1">Operation Log:</div>
                      <pre className="whitespace-pre-wrap text-gray-600">{saveLog}</pre>
                      {saveSuccess && (
                        <div className="mt-1 text-green-600 font-medium">✓ Save successful!</div>
                      )}
                    </div>
                  )}
                  
                  {/* Session and Status Info */}
                  <div className="p-3 border-t border-gray-200 space-y-2">
                    {/* Login Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                        {isLoggedIn ? (
                          <span className="text-green-600">Logged In</span>
                        ) : (
                          <span className="text-yellow-600">unknown user</span>
                        )}
                      </span>
                    </div>
                    
                    {/* Session Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Session:</span>
                      <span className="text-sm text-gray-800 font-medium">{formatElapsed(elapsed)}</span>
                    </div>
                    
                    {/* User Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total Named Users:</span>
                      <span className="text-sm text-gray-800 font-medium">{userCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Has Ever Logged In */}
              {userId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Ever Logged In:</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                    {hasLoggedIn ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </span>
                </div>
              )}
              
              {/* Account Created */}
              {userCreatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Created:</span>
                  <span className="text-xs text-gray-700">{userCreatedAt.toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Last Updated */}
              {userUpdatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last Updated:</span>
                  <span className="text-xs text-gray-700">{userUpdatedAt.toLocaleDateString()}</span>
                </div>
              )}
              
              {/* Token Economics - Collapsible Section */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button 
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setIsTokenEconomicsOpen(!isTokenEconomicsOpen)}
                >
                  <h4 className="text-xs font-medium text-gray-700">Token Economics</h4>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-gray-500 transition-transform ${isTokenEconomicsOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={`mt-2 text-xs bg-gray-50 p-3 rounded-md transition-all ${isTokenEconomicsOpen ? 'block' : 'hidden'}`}
                >
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Token Accrual:</span>
                    <ul className="list-disc pl-4 mt-1 text-gray-600 space-y-1">
                      <li>You earn ¤0.0001 per second (¤8.64 per day)</li>
                      <li>Tokens accrue continuously while session is active</li>
                      <li>Monthly target: ¤260 (approximately)</li>
                    </ul>
                  </div>
                  
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Token Usage:</span>
                    <ul className="list-disc pl-4 mt-1 text-gray-600 space-y-1">
                      <li>Change username: ¤0.000777</li>
                      <li>Switch accounts: ¤0.000777</li>
                      <li>Fund account: minimum ¤0.000777</li>
                    </ul>
                  </div>
                  
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Token System:</span>
                    <p className="mt-1 text-gray-600">
                      Tokens represent your participation in the BUBIWOT ecosystem. All burned tokens are tracked transparently on-chain. As the system grows, more token utilities will be added.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full flex flex-col items-center text-center">
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
            {/* Login button removed */}
          </div>
          <span className="text-xs text-gray-800 mt-2">© 2025 BUBIWOT Protocol</span>
          <span className="text-xs text-gray-700 mt-1">
            Donate BTC: bc1q2hcaje8l7uzsc2jdfhe3svfczy3mlxeuvuet8h
          </span>
          <span className="text-xs text-gray-700 mt-1">
            Total Burned Credits: {totalBurnedCredits}
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
        _onLogout={handleLogout} 
      />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={{
          userId: userId || '',
          alias,
          credits,
        }}
        onUpdateAlias={handleUpdateAlias}
        onSwitchAccount={handleSwitchAccount}
      />
    </div>
  );
}
