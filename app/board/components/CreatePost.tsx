'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [promotionValue, setPromotionValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user info from localStorage
  useEffect(() => {
    // Try multiple possible localStorage key patterns
    const alias = localStorage.getItem('bubiwot_user_alias') || localStorage.getItem('bubiwot_alias');
    const id = localStorage.getItem('bubiwot_user_id') || localStorage.getItem('bubiwot_id');
    const password = localStorage.getItem('bubiwot_user_password') || localStorage.getItem('bubiwot_password');
    
    setUserAlias(alias);
    setUserId(id);
    
    // Comprehensive debug: log ALL localStorage items
    console.log('=== COMPLETE localStorage DEBUG ===');
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    // Log all bubiwot-related keys
    const bubiwotKeys = allKeys.filter(key => key.includes('bubiwot'));
    console.log('All bubiwot keys:', bubiwotKeys);
    
    // Log ALL localStorage key-value pairs
    console.log('ALL localStorage data:');
    allKeys.forEach(key => {
      console.log(`  ${key}: ${localStorage.getItem(key)}`);
    });
    
    // Log specific values we're looking for
    console.log('Auth values we found:', {
      alias: alias,
      id: id,
      password: password ? '***exists***' : null,
      hasLoggedIn: localStorage.getItem('bubiwot_user_has_logged_in'),
      sessionStart: localStorage.getItem('bubiwot_session_start'),
    });
    
    // Log all bubiwot localStorage values with their actual content
    console.log('All bubiwot localStorage data:');
    bubiwotKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value}`);
    });
    
  }, []);

  const onChange = useCallback((value: string) => {
    // Limit to 1000 characters
    if (value.length <= 1000) {
      setContent(value);
      setCharacterCount(value.length);
      // Calculate cost: 0.1 per character + promotion value
      const characterCost = value.length * 0.1;
      setEstimatedCost(characterCost + promotionValue);
    }
  }, [promotionValue]);

  useEffect(() => {
    // Recalculate cost when promotion value changes
    const characterCost = characterCount * 0.1;
    setEstimatedCost(characterCost + promotionValue);
  }, [promotionValue, characterCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Get session info from localStorage - this is what's actually available
    const sessionId = localStorage.getItem('bubiwot_session_id');
    const sessionStart = localStorage.getItem('bubiwot_session_start');
    
    console.log('=== AUTH ATTEMPT DEBUG ===');
    console.log('Found session data:', { sessionId, sessionStart });

    if (!sessionId) {
      console.log('No session ID found');
      setError('No session found. Please refresh the page.');
      return;
    }

    console.log('Proceeding with session-based authentication...');

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          promotionValue,
          sessionId,
          isAnonymous,
        }),
      });

      const responseData = await response.json();
      console.log('API response:', { status: response.status, data: responseData });

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create post');
      }

      // Update local state with user info from response
      if (responseData.author && !isAnonymous) {
        setUserAlias(responseData.author.alias);
        setUserId(responseData.author.id);
      }

      // Reset form
      setContent('');
      setPromotionValue(0);
      setCharacterCount(0);
      setEstimatedCost(0);
      onPostCreated();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">create post</h2>
        {userAlias && (
          <div className="text-sm text-gray-600">
            posting as: <span className="font-medium text-gray-900">{userAlias}</span>
            {userId && <span className="text-xs text-gray-500 ml-1">({userId})</span>}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="share your thoughts... (max 1000 characters)"
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center mt-2 text-sm text-gray-700">
            <span className={characterCount > 950 ? 'text-red-600 font-medium' : 'text-gray-700'}>
              {characterCount}/1000 characters
            </span>
            <span className="text-gray-700">character cost: {(characterCount * 0.1).toFixed(3)} credits</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="promotionValue" className="block text-sm font-medium text-gray-900 mb-1">
              promotion value (optional)
            </label>
            <input
              type="number"
              id="promotionValue"
              min="0"
              step="0.001"
              value={promotionValue}
              onChange={(e) => setPromotionValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.000"
            />
            <p className="text-xs text-gray-600 mt-1">
              burn credits to promote your post higher
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              total cost: {estimatedCost.toFixed(3)} credits
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="mr-2 rounded"
            />
            post anonymously
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || characterCount > 1000}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'posting...' : 'post'}
          </button>
        </div>
      </form>
    </div>
  );
} 