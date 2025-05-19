'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `
# Incentivizing Social Graphs

## Abstract
We outline a minimal, platform-agnostic framework for rewarding peer-to-peer attestations via stake-backed contracts. Every interaction generates on-ledger promises and network fees that fund a Bitcoin-pegged UBI pool.

---

## 1. Variables & Constants
- i, j: users
- $C_{ij}$: contract between i→j
- $a_i$: amount pre-loaded by initiator
- $b_j$: amount pre-loaded by responder
- $\\phi$: network fee rate (0≤φ<1) (0 possible?)
- $F$: total fees accrued (operations) per epoch
- $U_i$: user i's promised earnings

---

## 2. Data Model

### Contracts
- $C_{ij} = \\{i, j, a, b, status, t_0, t_1\\}$
- $amount = max(a, b)$
- status: pending → signed at $t_1$

### Earnings
- On signing:
  $U_j \\;+=\\; (1-\\phi)\\,\\max(a,b)$

### Fees
- Collected by protocol:
  $F \\;+=\\; \\phi\\,\\max(a,b)$

---

## 3. Interaction Flow
1. Initiate: i calls createContract(i,j,a) (default a=0)
2. Propose: j calls propose($C_{ij}$,b) (default b=0)
3. Sign: either calls sign($C_{ij}$) → sets status, timestamp
4. Settle:
   - j's pending earnings $U_j += (1-\\phi)·\\max(a,b)$
   - protocol pool $F += \\phi·\\max(a,b)$

---

## 4. Network Value & Distribution

Let N be signed contracts in epoch t:
$F^{(t)} = \\phi\\sum_{k=1}^N \\max(a_k,b_k)$

Total promised UBI:
$\\Omega^{(t)} = (1-\\phi)\\sum_{k=1}^N \\max(a_k,b_k)$

Fees F can underwrite growth (marketing, dispute bounties), while Ω funds user UBI.

---

## 5. Discussion
- **Stateless**: contracts require no user history.
- **Flexible fees**: setting φ tunes protocol revenue vs. UBI.
- **Extensible**: layer in on-chain anchoring or trust-scores later.
- **Safety**: default zero-stake contracts minimize risk.
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