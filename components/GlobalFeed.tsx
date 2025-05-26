"use client";
import React, { useState, useEffect } from 'react';

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

// Define types for the post item component
type PostItemType = Post | Reply;

const PostItem: React.FC<{
  post: PostItemType;
  isReply?: boolean;
  depth?: number;
  onReply: (postId: string, parentReplyId?: string) => void;
  showReplies?: boolean;
}> = ({ post, isReply = false, depth = 0, onReply, showReplies = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const maxDepth = 8;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculate total value based on post type
  const totalValue = isReply 
    ? parseFloat((post as Reply).donatedValue?.toString() || '0') 
    : parseFloat((post as Post).totalValue?.toString() || '0');

  const hasReplies = 'replies' in post && post.replies && post.replies.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l border-gray-200 pl-3' : ''} mb-3`}>
      <div className="bg-white p-3 border border-gray-200 hover:bg-gray-50 transition-colors">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">
              {post.author?.alias || 'Anonymous'}
            </span>
            <span>•</span>
            <span>{post.timeAgo}</span>
            {hasReplies && (
              <>
                <span>•</span>
                <button
                  onClick={handleToggleCollapse}
                  className="text-blue-600 hover:underline"
                >
                  {isCollapsed ? 'expand' : 'collapse'} ({(post as Post).replies?.length || 0})
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>¤{totalValue.toFixed(3)}</span>
            <span>↑{post._count.valueDonations}</span>
            <span>😊{post._count.emojiReactions}</span>
          </div>
        </div>

        {/* Post Content */}
        <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <button
            onClick={() => onReply(
              'replies' in post ? post.id : (post as Reply).id,
              isReply ? post.id : undefined
            )}
            className="hover:text-blue-600 transition-colors"
          >
            reply
          </button>
          <button className="hover:text-blue-600 transition-colors">
            donate
          </button>
          <button className="hover:text-blue-600 transition-colors">
            😊 react
          </button>
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && !isCollapsed && showReplies && depth < maxDepth && (
        <div className="mt-2">
          {(post as Post).replies.map((reply: Reply) => (
            <PostItem
              key={reply.id}
              post={reply}
              isReply={true}
              depth={depth + 1}
              onReply={onReply}
              showReplies={showReplies}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ReplyForm: React.FC<{
  postId: string;
  parentReplyId?: string;
  onSubmit: (content: string, postId: string, parentReplyId?: string) => Promise<void>;
  onCancel: () => void;
}> = ({ postId, parentReplyId, onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCost = content.length * 0.05;
  const totalCost = characterCost; // No protocol fee for replies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, postId, parentReplyId);
      setContent('');
      onCancel();
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-3 border border-gray-200 mb-3">
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="Write a reply..."
            className="w-full p-2 border border-gray-300 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{content.length}/1000 characters</span>
            <span>Cost: ¤{totalCost.toFixed(3)} (all burned)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Reply'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const PostForm: React.FC<{
  onSubmit: (content: string, promotionValue: number) => Promise<void>;
}> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [promotionValue, setPromotionValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const contentCost = content.length * 0.1;
  const protocolFee = promotionValue * 0.03; // 3% protocol fee
  const totalCost = contentCost + promotionValue + protocolFee;
  const totalBurned = contentCost + protocolFee; // What gets burned

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content, promotionValue);
      setContent('');
      setPromotionValue(0);
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Create Post</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 1000))}
            placeholder="What&apos;s on your mind? Share your thoughts..."
            className="w-full p-3 border border-gray-300 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            maxLength={1000}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{content.length}/1000 characters</span>
            <span>Content cost: ¤{contentCost.toFixed(3)} (burned)</span>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Promotion Value (boost visibility)
          </label>
          <input
            type="number"
            value={promotionValue}
            onChange={(e) => setPromotionValue(Math.max(0, parseFloat(e.target.value) || 0))}
            min="0"
            step="0.001"
            className="w-full p-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            Higher promotion value = better visibility
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mb-3 p-3 bg-gray-50 rounded border">
          <div className="text-xs font-medium text-gray-700 mb-2">Cost Breakdown:</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Content ({content.length} chars × ¤0.1):</span>
              <span className="text-red-600">¤{contentCost.toFixed(3)} (burned)</span>
            </div>
            <div className="flex justify-between">
              <span>Promotion value:</span>
              <span className="text-blue-600">¤{promotionValue.toFixed(3)} (to post)</span>
            </div>
            <div className="flex justify-between">
              <span>Protocol fee (3%):</span>
              <span className="text-red-600">¤{protocolFee.toFixed(3)} (burned)</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200 font-medium text-gray-700">
              <span>Total cost:</span>
              <span>¤{totalCost.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Total burned:</span>
              <span className="text-red-600">¤{totalBurned.toFixed(3)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            Total Cost: ¤{totalCost.toFixed(3)}
          </div>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

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
  const [sortBy, setSortBy] = useState<'effectiveValue' | 'totalValue' | 'createdAt'>('effectiveValue');
  const [replyForm, setReplyForm] = useState<{ postId: string; parentReplyId?: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchPosts = async (pageNum: number = 1, sortOrder: string = 'effectiveValue', append: boolean = false) => {
    try {
      setError(null);
      if (!append) setLoading(true);

      const response = await fetch(
        `/api/posts/feed?page=${pageNum}&limit=10&sortBy=${sortOrder}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (append) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, sortBy, false);
  }, [sortBy]);

  const handleCreatePost = async (content: string, promotionValue: number) => {
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
      
      // Refresh the feed
      fetchPosts(1, sortBy, false);
      
    } catch (error) {
      console.error('💥 Error creating post:', error);
      throw error;
    }
  };

  const handleCreateReply = async (content: string, postId: string, parentReplyId?: string) => {
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reply');
      }

      // Refresh the feed to show new reply
      fetchPosts(1, sortBy, false);
      
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  };

  const handleReply = (postId: string, parentReplyId?: string) => {
    setReplyForm({ postId, parentReplyId });
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchPosts(page + 1, sortBy, true);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Loading posts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-red-500">
          <div className="text-sm">Error: {error}</div>
          <button
            onClick={() => fetchPosts(1, sortBy, false)}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create Post Button/Form */}
      {!showCreateForm ? (
        <div className="text-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            ✏️ Create Post
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Create New Post</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ×
            </button>
          </div>
          <PostForm onSubmit={handleCreatePost} />
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortBy('effectiveValue')}
          className={`px-3 py-1 text-xs rounded ${
            sortBy === 'effectiveValue'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Hot
        </button>
        <button
          onClick={() => setSortBy('totalValue')}
          className={`px-3 py-1 text-xs rounded ${
            sortBy === 'totalValue'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Top
        </button>
        <button
          onClick={() => setSortBy('createdAt')}
          className={`px-3 py-1 text-xs rounded ${
            sortBy === 'createdAt'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          New
        </button>
      </div>

      {/* Reply Form */}
      {replyForm && (
        <ReplyForm
          postId={replyForm.postId}
          parentReplyId={replyForm.parentReplyId}
          onSubmit={handleCreateReply}
          onCancel={() => setReplyForm(null)}
        />
      )}

      {/* Posts List */}
      <div className="space-y-2">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onReply={handleReply}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* End of Feed Message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          You&apos;ve reached the end of the feed
        </div>
      )}

      {/* No Posts Message */}
      {!loading && posts.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-sm font-medium">No posts yet</div>
          <div className="text-xs mt-1">Be the first to share something!</div>
        </div>
      )}
    </div>
  );
};

export default GlobalFeed; 