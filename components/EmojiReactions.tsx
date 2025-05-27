"use client";
import React, { useState } from 'react';

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

interface EmojiReactionsProps {
  postId?: string;
  replyId?: string;
  reactions: EmojiReaction[];
  onReactionClick?: (emoji: string) => void;
  className?: string;
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({
  reactions,
  onReactionClick,
  className = ''
}) => {
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Handle mouse enter for tooltip
  const handleMouseEnter = (emoji: string, event: React.MouseEvent) => {
    setHoveredReaction(emoji);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredReaction(null);
  };

  if (!reactions || reactions.length === 0) {
    return null;
  }

  const getReactionTooltip = (reaction: EmojiReaction) => {
    const topTippers = reaction.users
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return (
      <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs">
        <div className="font-medium mb-2">
          {reaction.emoji} {reaction.count} {reaction.count === 1 ? 'reaction' : 'reactions'}
        </div>
        <div className="text-gray-300 mb-2">
          Total tips: ¤{reaction.totalAmount.toFixed(6)}
        </div>
        {topTippers.length > 0 && (
          <div>
            <div className="text-gray-400 text-xs mb-1">Top tippers:</div>
            {topTippers.map((user) => (
              <div key={user.id} className="flex justify-between text-xs">
                <span className="truncate mr-2">{user.alias}</span>
                <span>¤{user.amount.toFixed(3)}</span>
              </div>
            ))}
            {reaction.users.length > 5 && (
              <div className="text-gray-400 text-xs mt-1">
                +{reaction.users.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {reactions.map((reaction) => {
          const hasValue = reaction.totalAmount > 0;
          
          return (
            <button
              key={reaction.emoji}
              onClick={() => onReactionClick?.(reaction.emoji)}
              onMouseEnter={(e) => handleMouseEnter(reaction.emoji, e)}
              onMouseLeave={handleMouseLeave}
              className={`
                relative flex items-center gap-1 px-2 py-1 rounded-full border text-sm
                transition-all duration-200 hover:scale-105 hover:shadow-md
                ${hasValue 
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400' 
                  : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                }
              `}
            >
              {/* Emoji with glow effect for tipped reactions */}
              <span 
                className={`
                  text-lg transition-all duration-300
                  ${hasValue ? 'drop-shadow-lg' : ''}
                `}
                style={{
                  filter: hasValue ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' : 'none'
                }}
              >
                {reaction.emoji}
              </span>
              
              {/* Count */}
              <span className={`
                font-medium
                ${hasValue ? 'text-orange-700' : 'text-gray-600'}
              `}>
                {reaction.count}
              </span>
              
              {/* Value indicator */}
              {hasValue && (
                <span className="text-xs text-orange-600 font-medium">
                  ¤{reaction.totalAmount.toFixed(3)}
                </span>
              )}
              
              {/* Sparkle animation for high-value reactions */}
              {hasValue && reaction.totalAmount > 0.01 && (
                <div className="absolute -top-1 -right-1">
                  <span className="text-xs animate-pulse">✨</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredReaction && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {getReactionTooltip(reactions.find(r => r.emoji === hoveredReaction)!)}
        </div>
      )}
    </>
  );
};

export default EmojiReactions; 