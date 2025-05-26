"use client";
import React, { useState } from 'react';
import GlobalFeed from '@/components/GlobalFeed';

export default function TestFeedPage() {
  const [credits, setCredits] = useState(1.0);
  
  // Mock user data for testing
  const mockUserId = "test-user-123";
  const mockPassword = "test-password";

  const handleCreditsUpdate = (newCredits: number) => {
    setCredits(newCredits);
    console.log('Credits updated:', newCredits);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Global Feed Test
          </h1>
          <p className="text-gray-600">
            Testing the reddit-style threaded discussion interface
          </p>
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border">
            <div className="text-sm text-gray-600">
              <strong>Test User:</strong> {mockUserId} | 
              <strong> Credits:</strong> ¤{credits.toFixed(3)} | 
              <strong> Password:</strong> {mockPassword}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <GlobalFeed
            userId={mockUserId}
            userPassword={mockPassword}
            credits={credits}
            onCreditsUpdate={handleCreditsUpdate}
          />
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Features Implemented:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Reddit-style threaded discussions with indentation</li>
            <li>✅ Collapsible threads with expand/collapse buttons</li>
            <li>✅ Minimalistic Craigslist-inspired styling</li>
            <li>✅ Author alias, timestamp, and value display</li>
            <li>✅ Stake amount and total donations shown</li>
            <li>✅ Sorting by effective value, total value, and time</li>
            <li>✅ Pagination with &quot;Load More&quot; functionality</li>
            <li>✅ Reply button for each post and reply</li>
            <li>✅ Real-time cost calculation for posts and replies</li>
            <li>✅ Responsive design with hover effects</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">API Endpoints:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li><code>GET /api/posts/feed</code> - Fetch posts with nested replies</li>
            <li><code>POST /api/posts</code> - Create a new post</li>
            <li><code>POST /api/replies</code> - Create a reply to a post or reply</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 