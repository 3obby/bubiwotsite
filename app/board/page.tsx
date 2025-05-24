'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import SaveTokensButton from '../../components/SaveTokensButton';

export default function BoardPage() {
  const [sortBy, setSortBy] = useState<'value' | 'time'>('value');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link href="/" className="text-sm font-extralight tracking-wider text-gray-600">
          bubiwot
        </Link>
        <div className="flex items-center space-x-4">
          <SaveTokensButton compact={true} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'value' | 'time')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="value">sort by value</option>
            <option value="time">sort by time</option>
          </select>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">global board</h1>
          <p className="text-gray-600 mb-6">
            share thoughts, burn credits to promote content, and donate value to posts you appreciate
          </p>
          
          <CreatePost onPostCreated={triggerRefresh} />
          
          <div className="mt-8">
            <PostList sortBy={sortBy} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
} 