'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `
# Introduction to BUBIWOT Protocol

Towards:
- Trust-minimized proof-of-personhood.
- Next-gen authentication.
- Next-gen account management.
- Universal basic income.

### What is BUBIWOT?

BUBIWOT (Bitcoin-backed Universal Basic Income Web of Trust) is a revolutionary protocol that combines the economic security of Bitcoin with the social promise of Universal Basic Income. It creates a trust-minimized system for distributing Bitcoin-backed UBI tokens to real humans through anonymous peer attestations.

### Core Principles

- **Trust Minimization**: No central authority controls the distribution or verification process
- **Proof of Humanity**: Real humans are verified through peer attestations, not centralized systems
- **Bitcoin-Backed Value**: UBI tokens are backed by Bitcoin reserves, ensuring strong economic security
- **Censorship Resistance**: Decentralized architecture prevents any single entity from controlling access
- **Privacy First**: Anonymous attestations protect user identity while ensuring authenticity
- **Bot-Resistant**: This architecture is specifically designed to be resistant to bots and other forms of automated abuse

### How It Works

The BUBIWOT protocol builds a new crypographic primitive- the trust-minimized web of trust- on three fundamental layers:

#### 1. Identity Layer
- Users generate cryptographic keypairs client-side
- Private keys are secured locally using biometric authentication (WebAuthn/passkeys)
- No personal information is stored or required

#### 2. Peer Layer
- Users vouch for each other's humanity through cryptographic signatures
- Attestations enable webs of trust
- A threshold of attestations (k-of-n) is required for verification

#### 3. Economic Layer
- Verified humans receive equal allocations of BUBI tokens
- Distribution follows a predictable inflation schedule (3% APR)
- Tokens accrue continuously and proportionally, entitling holders to distributions of Bitocin and other assets.

### Key Innovations

**Anonymous Peer Verification**: Unlike traditional identity systems that rely on documents or biometrics tied to real identities, BUBIWOT uses anonymous peer attestations where humans vouch for other humans without revealing personal information.

**Bitcoin Economic Security**: By backing UBI tokens with Bitcoin reserves, the protocol ensures that the distributed tokens have real economic value and are not subject to arbitrary inflation by central authorities.

**Progressive Decentralization**: The system starts with practical off-chain components and progressively moves toward full on-chain settlement as the technology and adoption mature.

### Problem Statement

Current UBI proposals face several critical challenges:

1. **Trust Requirements**: Existing systems require trusted central authorities to distribute funds and verify recipients
2. **Sybil Attacks**: Difficult to prevent fake accounts without invasive identity verification
3. **Censorship**: Central authorities can exclude individuals or groups from participation
4. **Inflation Risk**: Fiat-backed UBI systems are subject to monetary policy and debasement
5. **Privacy Violations**: Traditional identity verification exposes sensitive personal information

BUBIWOT addresses each of these challenges through cryptographic and economic design.

### Vision

The ultimate vision of BUBIWOT is to create a global, permissionless Universal Basic Income system that:

- Provides economic security to all humans regardless of geography or political status
- Operates without relying on any government, corporation, or centralized entity
- Preserves privacy and human dignity in the verification process
- Creates sustainable economic value through Bitcoin's proven monetary properties
- Enables a new paradigm of human coordination and mutual aid

### Getting Started

The BUBIWOT protocol is currently in development, with an MVP focusing on:

- Client-side identity generation and management
- Peer attestation mechanisms
- UBI allocation tracking and visualization
- Foundation for future on-chain settlement

This introduction serves as the foundation for understanding how BUBIWOT reimagines Universal Basic Income for the digital age, combining the best of cryptographic security, economic sustainability, and human dignity.
`;

export default function BubiwotIntro() {
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