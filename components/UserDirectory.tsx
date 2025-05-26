import React, { useState, useEffect, useCallback } from 'react';

interface UserStats {
  postCount: number;
  replyCount: number;
  donationCount: number;
  burnedCredits: number;
  donationsGiven: number;
  donationsReceived: number;
  transactionCount: number;
  totalActivity: number;
}

interface DirectoryUser {
  id: string;
  alias: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
  hasLoggedIn: boolean;
  lifetimeAllocated: number;
  lifetimeCollected: number;
  lifetimeCollections: number;
  stats: UserStats;
}

export default function UserDirectory() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        limit: '50'
      });

      const response = await fetch(`/api/users/directory?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalUsers(data.pagination.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCredits = (credits: number) => {
    return credits.toFixed(6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading users</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button 
          onClick={fetchUsers}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and stats */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">User Directory</h3>
          <span className="text-sm text-gray-500">({totalUsers} users)</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-gray-600">Sort by:</span>
        {[
          { key: 'createdAt', label: 'Join Date' },
          { key: 'credits', label: 'Credits' },
          { key: 'alias', label: 'Name' },
          { key: 'lifetimeCollected', label: 'Lifetime Collected' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-2 py-1 rounded ${
              sortBy === key 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">👥</div>
            <div>No users found</div>
            {searchTerm && (
              <div className="text-sm mt-1">
                Try a different search term
              </div>
            )}
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg p-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{user.alias}</h4>
                    <span className="text-xs text-gray-500 font-mono">#{user.id.slice(-4)}</span>
                    {!user.hasLoggedIn && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        Never logged in
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <span className="ml-1 font-medium">{formatDate(user.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Credits:</span>
                      <span className="ml-1 font-medium text-green-600">¤{formatCredits(user.credits)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Posts:</span>
                      <span className="ml-1 font-medium">{user.stats.postCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Activity:</span>
                      <span className="ml-1 font-medium">{user.stats.totalActivity}</span>
                    </div>
                  </div>

                  {/* Lifetime stats bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Lifetime: ¤{formatCredits(user.lifetimeAllocated)} allocated</span>
                      <span>{user.lifetimeAllocated > 0 ? ((user.lifetimeCollected / user.lifetimeAllocated) * 100).toFixed(1) : 0}% collected</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${user.lifetimeAllocated > 0 ? Math.min((user.lifetimeCollected / user.lifetimeAllocated) * 100, 100) : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">
                    ¤{formatCredits(user.lifetimeCollected)}
                  </div>
                  <div className="text-xs text-gray-500">collected</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more message */}
      {users.length >= 50 && (
        <div className="text-center py-4 text-sm text-gray-500">
          Showing first 50 users. Use search to find specific users.
        </div>
      )}
    </div>
  );
} 