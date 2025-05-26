import React, { useState, useEffect, useCallback } from 'react';

interface UserProfileData {
  user: {
    id: string;
    alias: string;
    credits: number;
    createdAt: string;
    updatedAt: string;
    hasLoggedIn: boolean;
    accountActivatedAt: string;
    lastWithdrawAt: string | null;
    lifetimeAllocated: number;
    lifetimeCollected: number;
    lifetimeCollections: number;
  };
  recentPosts: Array<{
    id: string;
    content: string;
    promotionValue: number;
    donatedValue: number;
    totalValue: number;
    createdAt: string;
    _count: {
      replies: number;
      valueDonations: number;
      emojiReactions: number;
    };
  }>;
  recentReplies: Array<{
    id: string;
    content: string;
    donatedValue: number;
    createdAt: string;
    post: {
      id: string;
      content: string;
    };
    _count: {
      valueDonations: number;
      emojiReactions: number;
    };
  }>;
  recentTransactions: Array<{
    id: string;
    transactionType: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    metadata: unknown;
    createdAt: string;
  }>;
  burnedCredits: Array<{
    id: string;
    amount: number;
    action: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
  }>;
  donationsGiven: Array<{
    id: string;
    amount: number;
    isAnonymous: boolean;
    createdAt: string;
    post?: {
      id: string;
      content: string;
      author: { alias: string };
    };
    reply?: {
      id: string;
      content: string;
      author: { alias: string };
    };
  }>;
  donationsReceived: Array<{
    id: string;
    amount: number;
    isAnonymous: boolean;
    createdAt: string;
    donor?: { alias: string };
    post?: {
      id: string;
      content: string;
    };
    reply?: {
      id: string;
      content: string;
    };
  }>;
  statistics: {
    totalBurnedCredits: number;
    burnedCreditsCount: number;
    totalDonationsGiven: number;
    donationsGivenCount: number;
    totalDonationsReceived: number;
    donationsReceivedCount: number;
    postCount: number;
    totalPostValue: number;
    totalPostPromotions: number;
    replyCount: number;
    totalReplyValue: number;
    netWorth: number;
    activityScore: number;
  };
}

interface UserProfileProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ userId, isOpen, onClose }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'transactions' | 'donations'>('overview');

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId, fetchProfile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCredits = (credits: number) => {
    return credits.toFixed(6);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {profile ? `${profile.user.alias}'s Profile` : 'User Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading profile...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Error loading profile</div>
            <div className="text-sm text-gray-500">{error}</div>
            <button 
              onClick={fetchProfile}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {profile && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-white">
              {[
                { id: 'overview' as const, label: 'Overview', icon: '📊' },
                { id: 'posts' as const, label: 'Posts & Replies', icon: '📝' },
                { id: 'transactions' as const, label: 'Transactions', icon: '💳' },
                { id: 'donations' as const, label: 'Donations', icon: '💝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* User Info Card */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">User ID</div>
                        <div className="font-mono text-sm">#{profile.user.id.slice(-8)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Joined</div>
                        <div className="font-medium">{formatDate(profile.user.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Current Credits</div>
                        <div className="font-medium text-green-600">¤{formatCredits(profile.user.credits)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className={`text-sm font-medium ${profile.user.hasLoggedIn ? 'text-green-600' : 'text-yellow-600'}`}>
                          {profile.user.hasLoggedIn ? 'Active' : 'Never logged in'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{profile.statistics.postCount}</div>
                      <div className="text-sm text-blue-700">Posts</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{profile.statistics.replyCount}</div>
                      <div className="text-sm text-green-700">Replies</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">¤{formatCredits(profile.statistics.totalDonationsGiven)}</div>
                      <div className="text-sm text-purple-700">Given</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">¤{formatCredits(profile.statistics.totalDonationsReceived)}</div>
                      <div className="text-sm text-orange-700">Received</div>
                    </div>
                  </div>

                  {/* Lifetime Progress */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Lifetime Token Progress</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Allocated: ¤{formatCredits(profile.user.lifetimeAllocated)}</span>
                        <span>Collected: ¤{formatCredits(profile.user.lifetimeCollected)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${profile.user.lifetimeAllocated > 0 ? Math.min((profile.user.lifetimeCollected / profile.user.lifetimeAllocated) * 100, 100) : 0}%`
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{profile.user.lifetimeCollections} collections</span>
                        <span>{profile.user.lifetimeAllocated > 0 ? ((profile.user.lifetimeCollected / profile.user.lifetimeAllocated) * 100).toFixed(1) : 0}% efficiency</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Summary */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Activity Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Content Creation</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Posts Created:</span>
                            <span className="font-medium">{profile.statistics.postCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Replies Made:</span>
                            <span className="font-medium">{profile.statistics.replyCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Post Value:</span>
                            <span className="font-medium">¤{formatCredits(profile.statistics.totalPostValue)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-2">Financial Activity</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Credits Burned:</span>
                            <span className="font-medium text-red-600">¤{formatCredits(profile.statistics.totalBurnedCredits)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Worth:</span>
                            <span className="font-medium text-green-600">¤{formatCredits(profile.statistics.netWorth)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Activity Score:</span>
                            <span className="font-medium">{profile.statistics.activityScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Posts & Replies Tab */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Posts */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recent Posts ({profile.recentPosts.length})</h3>
                      <div className="space-y-3">
                        {profile.recentPosts.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">📝</div>
                            <div>No posts yet</div>
                          </div>
                        ) : (
                          profile.recentPosts.map((post) => (
                            <div key={post.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-sm text-gray-700 mb-2">
                                {truncateContent(post.content, 120)}
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{formatDate(post.createdAt)}</span>
                                <div className="flex gap-3">
                                  <span>¤{formatCredits(post.totalValue)}</span>
                                  <span>{post._count.replies} replies</span>
                                  <span>{post._count.valueDonations} donations</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Recent Replies */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recent Replies ({profile.recentReplies.length})</h3>
                      <div className="space-y-3">
                        {profile.recentReplies.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">💬</div>
                            <div>No replies yet</div>
                          </div>
                        ) : (
                          profile.recentReplies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">
                                Reply to: {truncateContent(reply.post.content, 50)}
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                {truncateContent(reply.content, 100)}
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{formatDate(reply.createdAt)}</span>
                                <div className="flex gap-3">
                                  <span>¤{formatCredits(reply.donatedValue)}</span>
                                  <span>{reply._count.valueDonations} donations</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
                      <div className="space-y-2">
                        {profile.recentTransactions.map((tx) => (
                          <div key={tx.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium capitalize">{tx.transactionType.replace('-', ' ')}</span>
                              <span className={`text-sm font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount >= 0 ? '+' : ''}¤{formatCredits(Math.abs(tx.amount))}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(tx.createdAt)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Balance: ¤{formatCredits(tx.balanceAfter)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Burned Credits */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Burned Credits</h3>
                      <div className="space-y-2">
                        {profile.burnedCredits.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">🔥</div>
                            <div>No credits burned</div>
                          </div>
                        ) : (
                          profile.burnedCredits.map((burned) => (
                            <div key={burned.id} className="bg-red-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium capitalize">{burned.action.replace('-', ' ')}</span>
                                <span className="text-sm font-medium text-red-600">
                                  -¤{formatCredits(burned.amount)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(burned.createdAt)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Donations Tab */}
              {activeTab === 'donations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Donations Given */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Donations Given ({profile.donationsGiven.length})
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          Total: ¤{formatCredits(profile.statistics.totalDonationsGiven)}
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {profile.donationsGiven.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">💸</div>
                            <div>No donations given</div>
                          </div>
                        ) : (
                          profile.donationsGiven.map((donation) => (
                            <div key={donation.id} className="bg-purple-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">
                                  To: {donation.post?.author?.alias || donation.reply?.author?.alias || 'Unknown'}
                                </span>
                                <span className="text-sm font-medium text-purple-600">
                                  ¤{formatCredits(donation.amount)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {truncateContent(donation.post?.content || donation.reply?.content || '', 80)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(donation.createdAt)}
                                {donation.isAnonymous && <span className="ml-2">(Anonymous)</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Donations Received */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Donations Received ({profile.donationsReceived.length})
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          Total: ¤{formatCredits(profile.statistics.totalDonationsReceived)}
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {profile.donationsReceived.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <div className="text-2xl mb-2">🎁</div>
                            <div>No donations received</div>
                          </div>
                        ) : (
                          profile.donationsReceived.map((donation) => (
                            <div key={donation.id} className="bg-orange-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">
                                  From: {donation.isAnonymous ? 'Anonymous' : (donation.donor?.alias || 'Unknown')}
                                </span>
                                <span className="text-sm font-medium text-orange-600">
                                  ¤{formatCredits(donation.amount)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {truncateContent(donation.post?.content || donation.reply?.content || '', 80)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(donation.createdAt)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 