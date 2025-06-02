'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '@/components/MarkdownContent';

// Content for this document with markdown styling
const documentContent = `
# BUBIWOT Roadmap

## Act I — MVP

✓ Generate identity keypair in session  
✓ Create persistent account with credit counter  
✓ Start passive token accrual  
✓ Enable alias assignment  
• Send tokens to peers  
✓ Deploy mobile-first webapp  
✓ Add value-ranked global message board  
✓ Track user/posts/credits in database

---

## Act II — IRL Trust

- Implement key splitting
- Enable QR-based IRL key exchange
- Add guardians for n-of-m recovery
- Pay users for attestations
- Visualize trust graph
- Enable recovery via quorum

---

## Act III — Bitcoin Backing

- Lock BTC in multisig or Babylon vault
- Publish proof-of-reserve
- Peg emission rate to BTC pool
- Enable BTC redemption queue
- Launch reserve dashboard

---

## Act IV — Identity Market

- Allow paid "is this you?" checks
- Reward confirmations with BUBI
- Add staking/slashing for false claims
- Enable encrypted private messages
- Add push notifications + PWA

---

## Act V — Protocol Expansion

- Open trust graph API
- Support plugins/modules
- Launch public trust explorer
- Enable wallet linking (WebAuthn + bridges)
- Reward IRL trust-builders
- Launch governance council

`;

export default function ProposedResearchDirection() {
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