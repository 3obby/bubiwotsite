import React from 'react';
import UserDirectory from './UserDirectory';

export default function UsersTab() {
  return (
    <div className="h-full flex flex-col">
      {/* Main Content - No header needed since we're in a tab */}
      <div className="flex-1 overflow-hidden">
        <UserDirectory />
      </div>
    </div>
  );
} 