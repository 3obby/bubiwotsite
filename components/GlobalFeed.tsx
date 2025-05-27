"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import EmojiReactions from './EmojiReactions';

// TypeScript interfaces
interface Author {
  id: string;
  alias: string;
}

interface Reply {
  id: string;
  content: string;
  authorId: string | null;
  author: Author | null;
  donatedValue: number;
  stake: number;
  effectiveValue: number;
  createdAt: string;
  timeAgo: string;
  _count: {
    valueDonations: number;
    emojiReactions: number;
  };
}

interface Post {
  id: string;
  content: string;
  authorId: string | null;
  author: Author | null;
  promotionValue: number;
  donatedValue: number;
  totalValue: number;
  stake: number;
  effectiveValue: number;
  createdAt: string;
  timeAgo: string;
  replies: Reply[];
  _count: {
    replies: number;
    valueDonations: number;
    emojiReactions: number;
  };
}

interface GlobalFeedProps {
  userId?: string;
  userPassword?: string;
  credits?: number;
  onCreditsUpdate?: (newCredits: number) => void;
}

interface ReplyModalData {
  postId: string;
  parentReplyId?: string;
  parentContent: string;
  parentAuthor: string;
  threadDepth: number;
}

// Define types for the post item component
type PostItemType = Post | Reply;

// New notification component for real-time updates
const NewPostNotification: React.FC<{
  count: number;
  onRefresh: () => void;
  onDismiss: () => void;
}> = ({ count, onRefresh, onDismiss }) => {
  if (count === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        <span className="text-sm font-medium">
          {count} new post{count > 1 ? 's' : ''} available
        </span>
        <button
          onClick={onRefresh}
          className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={onDismiss}
          className="text-blue-200 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Enhanced loading component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-blue-500 border-t-transparent ${sizeClasses[size]}`} />
  );
};

// Enhanced Reply Modal Component
const ReplyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  replyData: ReplyModalData | null;
  onSubmit: (content: string, postId: string, parentReplyId?: string, stakeAmount?: number) => Promise<void>;
  userCredits: number;
}> = ({ isOpen, onClose, replyData, onSubmit, userCredits }) => {
  const [content, setContent] = useState('');
  const [stakeAmount, setStakeAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuote, setShowQuote] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setStakeAmount(0);
      setShowQuote(true);
    }
  }, [isOpen]);

  if (!isOpen || !replyData) return null;

  const characterCost = content.length * 0.05;
  const totalCost = characterCost + stakeAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    if (totalCost > userCredits) {
      alert(`Insufficient credits. Need ¤${totalCost.toFixed(3)}, have ¤${Number(userCredits || 0).toFixed(3)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content, replyData.postId, replyData.parentReplyId, stakeAmount);
      onClose();
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThreadDepthColor = (depth: number) => {
    const colors = [
      'border-blue-200 bg-blue-50',
      'border-green-200 bg-green-50',
      'border-purple-200 bg-purple-50',
      'border-orange-200 bg-orange-50',
      'border-pink-200 bg-pink-50',
      'border-indigo-200 bg-indigo-50',
      'border-yellow-200 bg-yellow-50',
      'border-red-200 bg-red-50'
    ];
    return colors[depth % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">Reply</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${getThreadDepthColor(replyData.threadDepth)}`}>
              Thread Level {replyData.threadDepth + 1}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Quoted Content */}
        {showQuote && (
          <div className="p-4 border-b border-gray-200 animate-slideDown">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Replying to {replyData.parentAuthor}:</span>
              <button
                onClick={() => setShowQuote(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hide quote
              </button>
            </div>
            <div className="bg-gray-50 border-l-4 border-gray-300 pl-3 py-2 text-sm text-gray-600 italic">
              {replyData.parentContent.length > 200 
                ? `${replyData.parentContent.substring(0, 200)}...` 
                : replyData.parentContent
              }
            </div>
          </div>
        )}

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="Write your reply..."
              className="w-full p-3 border border-gray-300 text-sm text-black bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
              rows={6}
              maxLength={1000}
              autoFocus
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{content.length}/1000 characters</span>
              <span>Character cost: ¤{characterCost.toFixed(3)}</span>
            </div>
          </div>

          {/* Stake Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.001"
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="0.000"
              />
              <div className="text-xs text-gray-500 mt-1">
                Stake cost: ¤{stakeAmount.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <div className="flex justify-between text-sm">
              <span>Character cost:</span>
              <span>¤{characterCost.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Stake amount:</span>
              <span>¤{stakeAmount.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2 mt-2">
              <span>Total cost:</span>
              <span className={totalCost > userCredits ? 'text-red-600' : 'text-green-600'}>
                ¤{totalCost.toFixed(3)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Available: ¤{Number(userCredits || 0).toFixed(3)}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || totalCost > userCredits || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" />}
              {isSubmitting ? 'Submitting...' : 'Submit Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced PostItem component with smooth animations
const PostItem: React.FC<{
  post: PostItemType;
  isReply?: boolean;
  depth?: number;
  onReply: (postId: string, parentReplyId?: string, parentContent?: string, parentAuthor?: string, threadDepth?: number) => void;
  onEmojiReact: (targetId: string, targetType: 'post' | 'reply', emoji: string, amount: number) => Promise<void>;
  showReplies?: boolean;
  userCredits: number;
  isNew?: boolean;
}> = ({ post, isReply = false, depth = 0, onReply, onEmojiReact, showReplies = true, userCredits, isNew = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const handleEmojiSelect = async (emoji: string, amount: number) => {
    setIsReacting(true);
    try {
      await onEmojiReact(post.id, isReply ? 'reply' : 'post', emoji, amount);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to react:', error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Thread depth colors for visual hierarchy
  const getThreadColor = (depth: number) => {
    const colors = [
      'border-l-blue-400',
      'border-l-green-400',
      'border-l-purple-400',
      'border-l-orange-400',
      'border-l-pink-400',
      'border-l-indigo-400',
      'border-l-yellow-400',
      'border-l-red-400'
    ];
    return colors[depth % colors.length];
  };

  const getThreadBg = (depth: number) => {
    const backgrounds = [
      'bg-blue-50',
      'bg-green-50',
      'bg-purple-50',
      'bg-orange-50',
      'bg-pink-50',
      'bg-indigo-50',
      'bg-yellow-50',
      'bg-red-50'
    ];
    return backgrounds[depth % backgrounds.length];
  };

  const replies = 'replies' in post ? post.replies : [];
  const hasReplies = replies && replies.length > 0;

  return (
    <div 
      className={`
        ${isReply ? 'ml-4' : ''} 
        ${depth > 0 ? `border-l-4 ${getThreadColor(depth)} ${getThreadBg(depth)} pl-3` : ''}
        ${isNew ? 'animate-slideInFromTop bg-blue-50 border-blue-200' : ''}
        transition-all duration-300 ease-in-out
      `}
    >
      <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${isNew ? 'ring-2 ring-blue-300' : ''}`}>
        {/* Post Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {post.author?.alias || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">{post.timeAgo}</span>
            {isNew && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">
                New!
              </span>
            )}
          </div>
          
          {/* Value indicators */}
          <div className="flex items-center gap-2 text-xs">
            {'promotionValue' in post && post.promotionValue && Number(post.promotionValue) > 0 && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                ¤{Number(post.promotionValue).toFixed(3)} promoted
              </span>
            )}
            {post.donatedValue && Number(post.donatedValue) > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                ¤{Number(post.donatedValue).toFixed(3)} donated
              </span>
            )}
            {post.stake && Number(post.stake) > 0 && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                ¤{Number(post.stake).toFixed(3)} staked
              </span>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className={`text-gray-800 mb-3 transition-all duration-300 ${isCollapsed ? 'line-clamp-2' : ''}`}>
          {post.content}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Reply Button */}
            <button
              onClick={() => onReply(
                'replies' in post ? post.id : post.id,
                isReply ? post.id : undefined,
                post.content,
                post.author?.alias || 'Anonymous',
                depth
              )}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span>💬</span>
              <span>{'replies' in post._count ? post._count.replies : 0}</span>
            </button>

            {/* Emoji Reaction Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isReacting}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-yellow-600 transition-colors disabled:opacity-50"
              >
                {isReacting ? <LoadingSpinner size="sm" /> : <span>😊</span>}
                <span>{post._count.emojiReactions}</span>
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-10 animate-slideUp">
                  <EmojiPicker
                    isOpen={showEmojiPicker}
                    onEmojiSelect={handleEmojiSelect}
                    userCredits={userCredits}
                    onClose={() => setShowEmojiPicker(false)}
                    targetType={isReply ? 'reply' : 'post'}
                    targetId={post.id}
                  />
                </div>
              )}
            </div>

            {/* Collapse/Expand for posts with replies */}
            {hasReplies && (
              <button
                onClick={handleToggleCollapse}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isCollapsed ? '▶️ Expand' : '▼ Collapse'}
              </button>
            )}
          </div>

          {/* Effective Value */}
          <div className="text-sm font-medium text-gray-700">
            ¤{Number(post.effectiveValue || 0).toFixed(6)}
          </div>
        </div>

        {/* Emoji Reactions Display */}
        <EmojiReactions 
          postId={isReply ? undefined : post.id}
          replyId={isReply ? post.id : undefined}
          reactions={[]}
        />
      </div>

      {/* Replies */}
      {hasReplies && showReplies && !isCollapsed && (
        <div className="mt-2 space-y-2 animate-slideDown">
          {replies.map((reply) => (
            <PostItem
              key={reply.id}
              post={reply}
              isReply={true}
              depth={depth + 1}
              onReply={onReply}
              onEmojiReact={onEmojiReact}
              showReplies={showReplies}
              userCredits={userCredits}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Enhanced PostForm component
const PostForm: React.FC<{
  onSubmit: (content: string, promotionValue: number) => Promise<void>;
  isSubmitting?: boolean;
}> = ({ onSubmit, isSubmitting = false }) => {
  const [content, setContent] = useState('');
  const [promotionValue, setPromotionValue] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      await onSubmit(content, promotionValue);
      setContent('');
      setPromotionValue(0);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    }
  };

  const characterCost = content.length * 0.01;
  const totalCost = characterCost + promotionValue;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-slideDown">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="What's on your mind?"
            className="w-full p-3 border border-gray-300 text-sm text-black bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{content.length}/1000 characters</span>
            <span>Character cost: ¤{characterCost.toFixed(3)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Promotion Value (Optional)
          </label>
          <input
            type="number"
            value={promotionValue}
            onChange={(e) => setPromotionValue(Math.max(0, parseFloat(e.target.value) || 0))}
            min="0"
            step="0.001"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="0.000"
            disabled={isSubmitting}
          />
          <div className="text-xs text-gray-500 mt-1">
            Higher promotion values increase visibility
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-600">Total cost: </span>
            <span className="font-medium">¤{totalCost.toFixed(3)}</span>
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main GlobalFeed component with real-time updates
const GlobalFeed: React.FC<GlobalFeedProps> = ({ 
  userId, 
  userPassword, 
  credits, 
  onCreditsUpdate 
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('effectiveValue');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [replyModal, setReplyModal] = useState<ReplyModalData | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  
  // Real-time update states
  const [newPostCount, setNewPostCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(true);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  
  // Refs for managing intervals
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPostIdRef = useRef<string | null>(null);

  // Enhanced fetchPosts with real-time detection
  const fetchPosts = useCallback(async (
    pageNum: number = 1, 
    sortOrder: string = 'effectiveValue', 
    append: boolean = false,
    isPollingUpdate: boolean = false
  ) => {
    try {
      setError(null);
      if (!append && !isPollingUpdate) setLoading(true);

      const response = await fetch(
        `/api/posts/feed?page=${pageNum}&limit=10&sortBy=${sortOrder}&timestamp=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (isPollingUpdate && posts.length > 0) {
        // Check for new posts by comparing with current first post
        const currentFirstPostId = posts[0]?.id;
        const newPosts = data.posts.filter((post: Post) => 
          post.id !== currentFirstPostId && 
          new Date(post.createdAt) > lastFetchTime
        );
        
        if (newPosts.length > 0) {
          setNewPostCount(prev => prev + newPosts.length);
          setNewPostIds(prev => new Set([...prev, ...newPosts.map((p: Post) => p.id)]));
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${newPosts.length} new post${newPosts.length > 1 ? 's' : ''} available`, {
              body: newPosts[0].content.substring(0, 100) + '...',
              icon: '/favicon.ico',
              tag: 'new-posts'
            });
          }
        }
      } else {
        if (append) {
          setPosts(prev => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
          // Mark new posts for highlighting
          if (data.posts.length > 0) {
            const newIds = new Set<string>(data.posts.slice(0, newPostCount).map((p: Post) => p.id));
            setNewPostIds(newIds);
            // Clear new post indicators after a delay
            setTimeout(() => setNewPostIds(new Set<string>()), 5000);
          }
        }
        setNewPostCount(0);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
      setLastFetchTime(new Date());
      
      // Update last post ID reference
      if (data.posts.length > 0) {
        lastPostIdRef.current = data.posts[0].id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [posts, lastFetchTime, newPostCount]);

  // Setup real-time polling
  useEffect(() => {
    if (isPolling) {
      pollingIntervalRef.current = setInterval(() => {
        fetchPosts(1, sortBy, false, true);
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchPosts, sortBy, isPolling]);

  // Initial fetch and sort change handler
  useEffect(() => {
    fetchPosts(1, sortBy, false);
  }, [fetchPosts, sortBy]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Handle new post refresh
  const handleRefreshForNewPosts = () => {
    fetchPosts(1, sortBy, false);
  };

  // Handle dismissing new post notification
  const handleDismissNewPosts = () => {
    setNewPostCount(0);
  };

  const handleCreatePost = async (content: string, promotionValue: number) => {
    setIsSubmittingPost(true);
    try {
      // First, fetch fresh credits to ensure sync
      let syncedCredits = credits || 0; // fallback to current credits or 0
      if (userId && onCreditsUpdate) {
        try {
          console.log('🔄 Syncing credits before post creation...');
          const creditsResponse = await fetch(`/api/tokens/balance?userId=${userId}&_t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            syncedCredits = parseFloat(creditsData.user.credits) || 0;
            onCreditsUpdate(syncedCredits);
            console.log('✅ Credits synced successfully:', {
              clientCredits: credits,
              serverCredits: syncedCredits,
              difference: syncedCredits - (credits || 0)
            });
            
            // Add a small delay to ensure the sync propagates
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.warn('⚠️ Failed to sync credits:', creditsResponse.status);
          }
        } catch (syncError) {
          console.error('❌ Credit sync failed:', syncError);
        }
      }

      // Calculate total cost for validation
      const characterCost = content.length * 0.01;
      const totalCost = characterCost + promotionValue;
      
      // Check if we have enough credits after sync
      if (syncedCredits < totalCost) {
        throw new Error(`Insufficient credits after sync. Need ¤${totalCost.toFixed(3)}, but you have ¤${syncedCredits.toFixed(8)}. Please collect more tokens or reduce the promotion value.`);
      }

      console.log('💰 Creating post with:', {
        contentLength: content.length,
        characterCost: characterCost.toFixed(3),
        promotionValue: promotionValue.toFixed(3),
        totalCost: totalCost.toFixed(3),
        availableCredits: syncedCredits.toFixed(8)
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          promotionValue,
          userId,
          password: userPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server response error:', {
          status: response.status,
          error: errorData.error,
          serverCredits: errorData.serverCredits || 'unknown',
          requestedCost: totalCost.toFixed(3)
        });
        
        // Provide more helpful error message
        if (errorData.error?.includes('Insufficient credits')) {
          throw new Error(`${errorData.error}\n\nTip: Try collecting your accrued tokens first, or refresh the page to sync your credits.`);
        }
        throw new Error(errorData.error || 'Failed to create post');
      }

      const result = await response.json();
      
      // Update credits if callback provided
      if (onCreditsUpdate && result.user?.credits !== undefined) {
        const newCredits = parseFloat(result.user.credits);
        onCreditsUpdate(newCredits);
        console.log('✅ Post created successfully. Credits updated to:', newCredits);
      }
      
      // Hide the create form after successful submission
      setShowCreateForm(false);
      
      // Refresh the feed immediately to show the new post
      await fetchPosts(1, sortBy, false);
      
    } catch (error) {
      console.error('💥 Error creating post:', error);
      throw error;
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleCreateReply = async (content: string, postId: string, parentReplyId?: string, stakeAmount: number = 0) => {
    try {
      const response = await fetch('/api/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          postId,
          parentReplyId,
          userId,
          password: userPassword,
          stakeAmount, // Include stake amount in the request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reply');
      }

      // Refresh the feed to show new reply
      await fetchPosts(1, sortBy, false);
      
      // Update credits if callback provided
      if (onCreditsUpdate && credits !== undefined) {
        const characterCost = content.length * 0.05;
        const totalCost = characterCost + stakeAmount;
        onCreditsUpdate(credits - totalCost);
      }
      
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  };

  const handleReply = (postId: string, parentReplyId?: string, parentContent?: string, parentAuthor?: string, threadDepth: number = 0) => {
    setReplyModal({
      postId,
      parentReplyId,
      parentContent: parentContent || '',
      parentAuthor: parentAuthor || 'Anonymous',
      threadDepth
    });
  };

  const handleEmojiReact = async (targetId: string, targetType: 'post' | 'reply', emoji: string, amount: number) => {
    try {
      const response = await fetch('/api/emoji-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          targetType,
          emoji,
          amount,
          userId,
          password: userPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add reaction');
      }

      // Update credits if callback provided
      if (onCreditsUpdate && credits !== undefined) {
        onCreditsUpdate(credits - amount);
      }

      // Refresh the feed to show updated reactions
      await fetchPosts(1, sortBy, false);
      
    } catch (error) {
      console.error('Error adding emoji reaction:', error);
      throw error;
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, sortBy, true);
    }
  };

  // Loading state for initial load
  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-gray-500">
          <LoadingSpinner size="lg" />
          <div className="text-sm mt-2">Loading posts...</div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-red-500">
          <div className="text-sm mb-2">Error: {error}</div>
          <button
            onClick={() => fetchPosts(1, sortBy, false)}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Post Notification */}
      <NewPostNotification
        count={newPostCount}
        onRefresh={handleRefreshForNewPosts}
        onDismiss={handleDismissNewPosts}
      />

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>Live updates {isPolling ? 'enabled' : 'disabled'}</span>
          <span>•</span>
          <span>Last updated: {lastFetchTime.toLocaleTimeString()}</span>
        </div>
        <button
          onClick={() => setIsPolling(!isPolling)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isPolling ? 'Pause' : 'Resume'} updates
        </button>
      </div>

      {/* Create Post Form */}
      {showCreateForm && (
        <PostForm 
          onSubmit={handleCreatePost} 
          isSubmitting={isSubmittingPost}
        />
      )}

      {/* Toggle Create Form Button and Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          {showCreateForm ? (
            <>
              <span>✕</span>
              Cancel
            </>
          ) : (
            <>
              <span>✏️</span>
              Create Post
            </>
          )}
        </button>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSortBy('effectiveValue');
              fetchPosts(1, 'effectiveValue', false);
            }}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              sortBy === 'effectiveValue' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔥 Hot
          </button>
          <button
            onClick={() => {
              setSortBy('createdAt');
              fetchPosts(1, 'createdAt', false);
            }}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              sortBy === 'createdAt' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⚡ New
          </button>
          <button
            onClick={() => fetchPosts(1, sortBy, false)}
            className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center gap-1"
          >
            <LoadingSpinner size="sm" />
            Refresh
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onReply={handleReply}
            onEmojiReact={handleEmojiReact}
            userCredits={credits || 0}
            isNew={newPostIds.has(post.id)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading...
              </>
            ) : (
              <>
                <span>📄</span>
                Load More Posts
              </>
            )}
          </button>
        </div>
      )}

      {/* End of Feed Message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-medium">You&apos;ve reached the end!</div>
          <div className="text-xs mt-1">All caught up with the latest posts</div>
        </div>
      )}

      {/* No Posts Message */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-lg font-medium mb-2">No posts yet</div>
          <div className="text-sm mb-4">Be the first to share something amazing!</div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create First Post
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <ReplyModal
          isOpen={!!replyModal}
          onClose={() => setReplyModal(null)}
          replyData={replyModal}
          onSubmit={handleCreateReply}
          userCredits={credits || 0}
        />
      )}
    </div>
  );
};

export default GlobalFeed; 