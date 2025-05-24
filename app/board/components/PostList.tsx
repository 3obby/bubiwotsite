'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';

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
  };
  _count: {
    replies: number;
  };
}

interface PostListProps {
  sortBy: 'value' | 'time';
  refreshTrigger: number;
}

export default function PostList({ sortBy, refreshTrigger }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(
        `/api/posts?page=${pageNum}&sortBy=${sortBy}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (reset || pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPosts(1, true);
  }, [sortBy, refreshTrigger, fetchPosts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(page + 1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => fetchPosts(1, true)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">no posts yet. be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {posts.length} post{posts.length !== 1 ? 's' : ''} 
          {sortBy === 'value' ? ' sorted by value' : ' sorted by time'}
        </h2>
      </div>
      
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'loading...' : 'load more'}
          </button>
        </div>
      )}
    </div>
  );
} 