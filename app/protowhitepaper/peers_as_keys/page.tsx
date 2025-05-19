'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `

## Reputation is sovereign

Your network of friends/family should be your shared guardians- your trusted circle. Let them be the password you can never lose, replace, or forget. A long-running browser session can act as your ongoing signer of reputation, enabling you to access your new bank account and social identity- lose a device? No worries! If you are known to some peers, your account can be recovered with a simple visit, authorizing a new device. Friends of friends, even! As the network grows, you will be invited to meet new friends, proving they are a real, living person that knows a mutual contact- and you'll get paid in Bitcoin! This IRL mutual attestation strengthens the security of the network, and pays you increasingly more as you participate.

## Reputation is valuable

I attest that it is possible to transform the value of an individual's reputation into value- and I see an opportunity to put that value right into a person's pocket in the form of Bitcoin.

I see latent economic demand for strong-form reputation and identity validation- the evidence?: token airdrops which selectively target accounts based on activity. with reputation, with bitcoin-backed economics, it is possible to offer truly trust-minimized identity by binding economics, reputation, incentives, game theory- we can design a protocol to transparently issue a post-AGI Bitocin-backed UBI to sovereign, trust-minimized social accounts.

## Who will cheat?

You have a global identity now. You always did- but whose? Why not create your own- why not get paid for it directly?

This represents a collection of research/information which I (Bobby) am gathering to explore the design and technical feasibility of a novel protocol titled bubiwot (bitcoin universal basic income web of trust) an economically-incentivized social graph binding bitcoin with a social reputation and UBI ecosystem which is highly durable, trust-minimized, decentralized, and sovereign- an engine allowing (and paying people for-) sovereign identity attestation.
`;

export default function SovereignSocialCreditScore() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-gray-100">
        <Link href="/" className="text-sm font-extralight tracking-wider text-gray-600">
          bubiwot
        </Link>
        <Link href="/protowhitepaper" className="ml-4 text-sm text-blue-700 hover:underline">
          back to protowhitepaper
        </Link>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        {/* GitHub edit button */}
        <a
          href="https://github.com/3obby/bubiwotsite/tree/main/app/protowhitepaper"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gray-700 hover:text-blue-600 mb-4"
        >
          <svg 
            className="h-4 w-4 mr-1" 
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
          edit on github
        </a>
        
        <MarkdownContent content={documentContent} />
     
      </main>
    </div>
  );
} 