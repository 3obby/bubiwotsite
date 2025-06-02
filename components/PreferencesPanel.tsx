"use client";
import React, { useState } from 'react';
import { config, preferencesExplanations } from '@/lib/config';

interface PreferencesSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function PreferencesSection({ title, icon, children, defaultOpen = false }: PreferencesSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg border-b border-gray-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h4 className="font-medium text-gray-800">{title}</h4>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

interface ConfigItemProps {
  label: string;
  value: number | string;
  explanation: string;
  unit?: string;
  highlight?: boolean;
}

function ConfigItem({ label, value, explanation, unit = '¤', highlight = false }: ConfigItemProps) {
  return (
    <div className={`mb-4 last:mb-0 p-3 rounded-md ${highlight ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-mono px-2 py-1 rounded ${highlight ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
          {typeof value === 'number' && unit ? `${unit}${value}` : value}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{explanation}</p>
    </div>
  );
}

export default function PreferencesPanel() {
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Main Panel Header */}
      <button
        onClick={() => setIsMainPanelOpen(!isMainPanelOpen)}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <h3 className="font-semibold text-gray-800">System Preferences & FAQ</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isMainPanelOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isMainPanelOpen && (
        <div className="p-4 space-y-4">
          {/* Overview */}
          <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">💡 What are these numbers?</p>
            <p>These &ldquo;magic numbers&rdquo; control the economic behavior of the platform. We&apos;ve recently reduced message board costs by 90% to encourage more participation!</p>
          </div>

          {/* Token Economy */}
          <PreferencesSection title="Token Economy" icon="💰" defaultOpen={true}>
            <ConfigItem
              label="Base Earning Rate"
              value={config.tokenEconomy.baseRate}
              explanation={preferencesExplanations.tokenEconomy.baseRate}
              unit="¤"
              highlight={true}
            />
            <ConfigItem
              label="Annual Inflation Rate"
              value={`${config.tokenEconomy.annualInflationRate * 100}%`}
              explanation={preferencesExplanations.tokenEconomy.annualInflationRate}
              unit=""
            />
            <ConfigItem
              label="Default Starting Credits"
              value={config.tokenEconomy.defaultCredits}
              explanation={preferencesExplanations.tokenEconomy.defaultCredits}
            />
            <ConfigItem
              label="Withdrawal Cost"
              value={config.tokenEconomy.withdrawalCost}
              explanation={preferencesExplanations.tokenEconomy.withdrawalCost}
            />
          </PreferencesSection>

          {/* Messaging Costs */}
          <PreferencesSection title="Messaging Costs" icon="💬">
            <ConfigItem
              label="Post Character Cost"
              value={config.costs.messaging.postCharacterCost}
              explanation={preferencesExplanations.costs.messaging.postCharacterCost}
              highlight={true}
            />
            <ConfigItem
              label="Reply Character Cost"
              value={config.costs.messaging.replyCharacterCost}
              explanation={preferencesExplanations.costs.messaging.replyCharacterCost}
              highlight={true}
            />
            <ConfigItem
              label="Global Feed Character Cost"
              value={config.costs.messaging.globalFeedCharacterCost}
              explanation={preferencesExplanations.costs.messaging.globalFeedCharacterCost}
              highlight={true}
            />
            <div className="text-xs text-gray-600 mb-1">
              Reduced to 10% of original cost (was ¤0.1) - now posts cost just ¤0.01 per character instead of the previous ¤0.1
            </div>
          </PreferencesSection>

          {/* Action Costs */}
          <PreferencesSection title="Action Costs" icon="🎯">
            <ConfigItem
              label="Manual Save"
              value={config.costs.actions.manualSave}
              explanation={preferencesExplanations.costs.actions.manualSave}
            />
            <ConfigItem
              label="Update Username"
              value={config.costs.actions.updateAlias}
              explanation={preferencesExplanations.costs.actions.updateAlias}
              unit=""
            />
            <ConfigItem
              label="Switch Account"
              value={config.costs.actions.fundAccount}
              explanation={preferencesExplanations.costs.actions.fundAccount}
              unit=""
            />
            <ConfigItem
              label="Emoji Base Cost"
              value={config.costs.actions.emojiBaseCost}
              explanation={preferencesExplanations.costs.actions.emojiBaseCost}
            />
          </PreferencesSection>

          {/* Fee Structure */}
          <PreferencesSection title="Fee Structure" icon="📊">
            <ConfigItem
              label="System Fee Rate"
              value={`${config.costs.fees.systemFeeRate * 100}%`}
              explanation={preferencesExplanations.costs.fees.systemFeeRate}
              unit=""
            />
            <ConfigItem
              label="Protocol Fee Rate"
              value={`${config.costs.fees.protocolFeeRate * 100}%`}
              explanation={preferencesExplanations.costs.fees.protocolFeeRate}
              unit=""
            />
            <ConfigItem
              label="Author Share"
              value={`${config.costs.fees.authorShare * 100}%`}
              explanation={preferencesExplanations.costs.fees.authorShare}
              unit=""
            />
            <ConfigItem
              label="Ancestor Share"
              value={`${config.costs.fees.ancestorShare * 100}%`}
              explanation={preferencesExplanations.costs.fees.ancestorShare}
              unit=""
            />
          </PreferencesSection>
        </div>
      )}
    </div>
  );
}