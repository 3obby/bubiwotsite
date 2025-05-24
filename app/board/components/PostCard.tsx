'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Post {
  id: string;
  content: string;
  promotionValue: number;
  donatedValue: number;
  totalValue: number;
  createdAt: string;
  author: {
    id: string;
    alias: string;
  } | null;
  _count: {
    replies: number;
  };
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [donationAmount, setDonationAmount] = useState(0.001);
  const [isDonating] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [isAnonymousDonation, setIsAnonymousDonation] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDonate = async () => {
    if (donationAmount <= 0) return;

    try {
      // Get session data from localStorage
      const sessionId = localStorage.getItem('bubiwot_session_id');
      
      if (!sessionId) {
        console.error('No session found. Please go back to the main page and ensure you are logged in.');
        return;
      }

      console.log('Processing donation with session:', sessionId);

      const response = await fetch('/api/posts/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          amount: donationAmount,
          isAnonymous: isAnonymousDonation,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Donation failed:', data.error);
        return;
      }

      console.log('Donation successful:', data);
      
      // Update the post data with the response
      if (data) {
        // Reset donation form
        setDonationAmount(0);
        setIsAnonymousDonation(false);
        setShowDonationForm(false);
        
        // You might want to trigger a refresh of the post data here
        // or update the local state with the new totalValue
      }
    } catch (error) {
      console.error('Error donating:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">{post.author?.alias || 'Anonymous'}</span>
          <span>•</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-gray-500">value:</span>
            <span className="font-medium text-gray-900">
              {post.totalValue.toFixed(3)}
            </span>
          </div>
          {post.promotionValue > 0 && (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              promoted: {post.promotionValue.toFixed(3)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none mb-4">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{post._count.replies} replies</span>
          {post.donatedValue > 0 && (
            <span>donated: {post.donatedValue.toFixed(3)}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!showDonationForm ? (
            <button
              onClick={() => setShowDonationForm(true)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            >
              donate value
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={donationAmount}
                onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="0.001"
              />
              
              <label className="flex items-center text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={isAnonymousDonation}
                  onChange={(e) => setIsAnonymousDonation(e.target.checked)}
                  className="mr-1"
                />
                anon
              </label>

              <button
                onClick={handleDonate}
                disabled={isDonating || donationAmount <= 0}
                className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDonating ? '...' : 'donate'}
              </button>

              <button
                onClick={() => setShowDonationForm(false)}
                className="px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
              >
                cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 