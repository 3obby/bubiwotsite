"use client";
import React, { useState, useEffect, useCallback } from 'react';
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

interface EmojiReaction {
  emoji: string;
  count: number;
  totalAmount: number;
  users: Array<{
    id: string;
    alias: string;
    amount: number;
  }>;
}

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
      alert(`Insufficient credits. Need ¤${totalCost.toFixed(3)}, have ¤${userCredits.toFixed(3)}`);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Quoted Content */}
        {showQuote && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Replying to {replyData.parentAuthor}:</span>
              <button
                onClick={() => setShowQuote(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
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
              className="w-full p-3 border border-gray-300 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
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
                className="flex-1 px-3 py-2 border border-gray-300 text-sm text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.000"
              />
              <span className="text-sm text-gray-600">¤</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Staking credits can help boost your reply&#39;s visibility. Stake amount can be zero.
            </p>
          </div>

          {/* Cost Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Character cost:</span>
                <span>¤{characterCost.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stake amount:</span>
                <span>¤{stakeAmount.toFixed(3)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-gray-200 pt-1 mt-1">
                <span>Total cost:</span>
                <span>¤{totalCost.toFixed(3)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Your balance: ¤{userCredits.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting || totalCost > userCredits}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced PostItem with improved visual threading and emoji reactions
const PostItem: React.FC<{
  post: PostItemType;
  isReply?: boolean;
  depth?: number;
  onReply: (postId: string, parentReplyId?: string, parentContent?: string, parentAuthor?: string, threadDepth?: number) => void;
  onEmojiReact: (targetId: string, targetType: 'post' | 'reply', emoji: string, amount: number) => Promise<void>;
  showReplies?: boolean;
  userCredits: number;
}> = ({ post, isReply = false, depth = 0, onReply, onEmojiReact, showReplies = true, userCredits }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMoreReplies, setShowMoreReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([]);
  const maxDepth = 8;
  const maxVisibleReplies = 3;

  // Load emoji reactions for this post/reply
  const loadEmojiReactions = useCallback(async () => {
    try {
      const targetParam = isReply ? `replyId=${post.id}` : `postId=${post.id}`;
      
      const response = await fetch(`/api/emoji-reactions?${targetParam}`);
      if (response.ok) {
        const data = await response.json();
        setEmojiReactions(data.reactions || []);
      }
    } catch (error) {
      console.error('Failed to load emoji reactions:', error);
    }
  }, [post.id, isReply]);

  useEffect(() => {
    loadEmojiReactions();
  }, [loadEmojiReactions]);

  const handleEmojiSelect = async (emoji: string, amount: number) => {
    try {
      const targetType = isReply ? 'reply' : 'post';
      await onEmojiReact(post.id, targetType, emoji, amount);
      // Reload reactions after adding new one
      await loadEmojiReactions();
    } catch (error) {
      console.error('Failed to add emoji reaction:', error);
      throw error;
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculate total value based on post type
  const totalValue = isReply 
    ? parseFloat((post as Reply).donatedValue?.toString() || '0') 
    : parseFloat((post as Post).totalValue?.toString() || '0');

  const hasReplies = 'replies' in post && post.replies && post.replies.length > 0;
  const replyCount = hasReplies ? (post as Post).replies.length : 0;
  const visibleReplies = showMoreReplies ? (post as Post).replies : (post as Post).replies?.slice(0, maxVisibleReplies);
  const hiddenReplyCount = Math.max(0, replyCount - maxVisibleReplies);

  const getThreadColor = (depth: number) => {
    const colors = [
      'border-blue-300',
      'border-green-300', 
      'border-purple-300',
      'border-orange-300',
      'border-pink-300',
      'border-indigo-300',
      'border-yellow-300',
      'border-red-300'
    ];
    return colors[depth % colors.length];
  };

  const getThreadBg = (depth: number) => {
    if (depth === 0) return 'bg-white';
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
    return backgrounds[(depth - 1) % backgrounds.length];
  };

  return (
    <div className={`${depth > 0 ? `ml-4 border-l-2 ${getThreadColor(depth)} pl-3` : ''} mb-3`}>
      <div className={`${getThreadBg(depth)} p-3 border border-gray-200 hover:bg-opacity-80 transition-colors rounded-md`}>
        {/* Post Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {depth > 0 && (
              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono">
                L{depth}
              </span>
            )}
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
                  {isCollapsed ? '▶' : '▼'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
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
        <div className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Emoji Reactions */}
        {emojiReactions.length > 0 && (
          <div className="mb-3">
            <EmojiReactions
              postId={isReply ? undefined : post.id}
              replyId={isReply ? post.id : undefined}
              reactions={emojiReactions}
              onReactionClick={() => setShowEmojiPicker(true)}
              className="mb-2"
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <button
            onClick={() => onReply(
              'replies' in post ? post.id : (post as Reply).id,
              isReply ? post.id : undefined,
              post.content,
              post.author?.alias || 'Anonymous',
              depth
            )}
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <span>↩</span> reply
          </button>
          <button className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <span>💰</span> donate
          </button>
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <span>😊</span> react
          </button>
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && !isCollapsed && showReplies && depth < maxDepth && (
        <div className="mt-2">
          {visibleReplies?.map((reply: Reply) => (
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
          
          {/* Show More Replies Button */}
          {hiddenReplyCount > 0 && !showMoreReplies && (
            <div className="ml-4 mt-2">
              <button
                onClick={() => setShowMoreReplies(true)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>▼</span> Show {hiddenReplyCount} more {hiddenReplyCount === 1 ? 'reply' : 'replies'}
              </button>
            </div>
          )}
          
          {/* Show Less Replies Button */}
          {showMoreReplies && hiddenReplyCount > 0 && (
            <div className="ml-4 mt-2">
              <button
                onClick={() => setShowMoreReplies(false)}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>▲</span> Show fewer replies
              </button>
            </div>
          )}
        </div>
      )}

      {/* Deep Thread Warning */}
      {depth >= maxDepth && hasReplies && (
        <div className="ml-4 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          Thread too deep. <button className="text-blue-600 hover:underline">View in separate page</button>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPicker
          isOpen={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
          userCredits={userCredits}
          targetType={isReply ? 'reply' : 'post'}
          targetId={post.id}
          existingReactions={emojiReactions}
        />
      )}
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
            placeholder="What&#39;s on your mind? Share your thoughts..."
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
  const [sortBy, setSortBy] = useState('effectiveValue');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [replyModal, setReplyModal] = useState<ReplyModalData | null>(null);

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
      fetchPosts(1, sortBy, false);
      
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
          emoji,
          amount,
          postId: targetType === 'post' ? targetId : undefined,
          replyId: targetType === 'reply' ? targetId : undefined,
          userId,
          password: userPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add emoji reaction');
      }

      // Update credits if callback provided
      if (onCreditsUpdate && credits !== undefined) {
        const baseCost = 0.001;
        const systemFee = amount * 0.03;
        const totalCost = baseCost + amount + systemFee;
        onCreditsUpdate(credits - totalCost);
      }

      // Refresh the feed to show updated reaction counts
      fetchPosts(1, sortBy, false);
      
    } catch (error) {
      console.error('Error adding emoji reaction:', error);
      throw error;
    }
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
    <div className="space-y-4">
      {/* Create Post Form */}
      {showCreateForm && (
        <PostForm onSubmit={handleCreatePost} />
      )}

      {/* Toggle Create Form Button */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Post'}
        </button>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSortBy('effectiveValue');
              fetchPosts(1, 'effectiveValue', false);
            }}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'effectiveValue' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Hot
          </button>
          <button
            onClick={() => {
              setSortBy('createdAt');
              fetchPosts(1, 'createdAt', false);
            }}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === 'createdAt' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-2">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            onReply={handleReply}
            onEmojiReact={handleEmojiReact}
            userCredits={credits || 0}
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