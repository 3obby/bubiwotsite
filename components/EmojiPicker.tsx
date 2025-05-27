"use client";
import React, { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string, amount: number) => Promise<void>;
  userCredits: number;
  targetType: 'post' | 'reply';
  targetId: string;
  existingReactions?: Array<{
    emoji: string;
    count: number;
    totalAmount: number;
    users: Array<{
      id: string;
      alias: string;
      amount: number;
    }>;
  }>;
}

const POPULAR_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💯',
  '🎉', '👏', '🤔', '😍', '🙏', '💪', '✨', '🚀',
  '💰', '💎', '⚡', '🌟', '🎯', '🏆', '🔮', '🎨'
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  userCredits,
  targetType,
  targetId,
  existingReactions = []
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomEmoji, setShowCustomEmoji] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedEmoji('');
      setTipAmount(0);
      setCustomEmoji('');
      setShowCustomEmoji(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const baseCost = 0.001;
  const systemFee = tipAmount * 0.03;
  const totalCost = baseCost + tipAmount + systemFee;

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowCustomEmoji(false);
    setCustomEmoji('');
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      setSelectedEmoji(customEmoji.trim());
      setShowCustomEmoji(false);
    }
  };

  const handleSubmit = async () => {
    const emojiToUse = selectedEmoji || customEmoji.trim();
    if (!emojiToUse || isSubmitting) return;

    if (totalCost > userCredits) {
      alert(`Insufficient credits. Need ¤${totalCost.toFixed(6)}, have ¤${userCredits.toFixed(6)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onEmojiSelect(emojiToUse, tipAmount);
      onClose();
    } catch (error) {
      console.error('Failed to add emoji reaction:', error);
      alert('Failed to add emoji reaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExistingReaction = (emoji: string) => {
    return existingReactions.find(r => r.emoji === emoji);
  };

  const quickTipAmounts = [0, 0.001, 0.005, 0.01, 0.05, 0.1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={pickerRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            React with Emoji
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Target Info */}
        <div className="px-4 pt-2 text-xs text-gray-600">
          Reacting to {targetType}: {targetId.slice(-8)}
        </div>

        {/* Existing Reactions Summary */}
        {existingReactions.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2">Current reactions:</div>
            <div className="flex flex-wrap gap-2">
              {existingReactions.map((reaction) => (
                <div 
                  key={reaction.emoji}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full border text-sm"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-700 font-medium">{reaction.count}</span>
                  <span className="text-xs text-gray-600">¤{reaction.totalAmount.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emoji Grid */}
        <div className="p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">Choose an emoji:</div>
          <div className="grid grid-cols-8 gap-2 mb-4">
            {POPULAR_EMOJIS.map((emoji) => {
              const existing = getExistingReaction(emoji);
              const isSelected = selectedEmoji === emoji;
              
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`
                    relative p-2 text-2xl rounded-lg border-2 transition-all hover:scale-110
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    ${existing ? 'bg-yellow-50' : ''}
                  `}
                >
                  {emoji}
                  {existing && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {existing.count}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Emoji Input */}
          <div className="mb-4">
            <button
              onClick={() => setShowCustomEmoji(!showCustomEmoji)}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              {showCustomEmoji ? 'Hide custom emoji' : 'Use custom emoji'}
            </button>
            
            {showCustomEmoji && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value.slice(0, 10))}
                  placeholder="Enter emoji or text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={10}
                />
                <button
                  onClick={handleCustomEmojiSubmit}
                  disabled={!customEmoji.trim()}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  Use
                </button>
              </div>
            )}
          </div>

          {/* Selected Emoji Display */}
          {selectedEmoji && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedEmoji}</span>
                <span className="text-sm text-gray-800 font-medium">Selected</span>
              </div>
            </div>
          )}

          {/* Tip Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip Amount (Optional)
            </label>
            
            {/* Quick Tip Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {quickTipAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`
                    px-3 py-2 text-sm rounded-md border transition-colors font-medium
                    ${tipAmount === amount 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  {amount === 0 ? 'Free' : `¤${amount.toFixed(3)}`}
                </button>
              ))}
            </div>

            {/* Custom Tip Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.001"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.000"
              />
              <span className="text-sm text-gray-700 font-medium">¤</span>
            </div>
            
            <p className="text-xs text-gray-600 mt-1">
              85% goes to author, 12% to thread ancestors, 3% system fee
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-800">
              <div className="flex justify-between">
                <span>Base cost:</span>
                <span className="font-medium">¤{baseCost.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip amount:</span>
                <span className="font-medium">¤{tipAmount.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span>System fee (3%):</span>
                <span className="font-medium">¤{systemFee.toFixed(6)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-gray-200 pt-1 mt-1 text-gray-900">
                <span>Total cost:</span>
                <span>¤{totalCost.toFixed(6)}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Your balance: <span className="font-medium text-gray-800">¤{userCredits.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedEmoji || isSubmitting || totalCost > userCredits}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Adding...' : 'Add Reaction'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-md hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker; 