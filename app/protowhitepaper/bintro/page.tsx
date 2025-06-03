'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `
# Introduction to BUBIWOT Protocol

**Layer-Zero for the Trust-Minimized Web of Trust**

Towards:
- Trust-minimized proof-of-personhood.
- Next-gen authentication.
- Next-gen account management.
- Universal basic income.
- Social cryptographic primitives.

### What is BUBIWOT?

BUBIWOT (Bitcoin-backed Universal Basic Income Web of Trust) is the **foundational layer-zero protocol** for a new cryptographic primitive: the **trust-minimized web of trust**. 

While initially designed for Bitcoin-backed Universal Basic Income distribution, BUBIWOT establishes the fundamental infrastructure for any application requiring trust-minimized human verification, social recovery, and decentralized identity management.

The protocol creates a revolutionary system where **every real-world interaction serves dual cryptographic purposes**: proving humanity for economic participation AND building threshold signature recovery networks.

### The Trust-Minimized Web of Trust Primitive

BUBIWOT introduces a new cryptographic primitive that enables:

**🤝 Dual-Purpose IRL Attestations**
- **Humanity Verification**: Cryptographic proof of human uniqueness without revealing identity
- **Key Fragment Exchange**: Threshold signature share distribution for social recovery
- **Progressive Trust Building**: Each interaction strengthens both verification and recovery networks

**🔐 Threshold Social Recovery**
- **Incremental Decentralization**: Start with single device, progressively add guardians
- **Flexible Security Models**: 2-of-3 → 3-of-5 → 4-of-7 thresholds adapt to social network growth
- **Bitcoin-Native Recovery**: FROST signatures work directly with Bitcoin/Lightning

**🌐 Network-Effect Trust**
- **Cryptographic Social Graphs**: Anonymous attestations create verifiable trust networks
- **Sybil Resistance**: Physical attestations prevent fake account proliferation
- **Reputation Layers**: Trust scores emerge from attestation quality and frequency

### Core Principles

- **Trust Minimization**: No central authority controls verification, distribution, or recovery processes
- **IRL-First Architecture**: Physical meetings create the strongest cryptographic trust bonds
- **Progressive Decentralization**: Security and trust models upgrade incrementally with social network growth
- **Bitcoin-Native Implementation**: Direct integration with Bitcoin, Lightning, and threshold cryptography
- **Privacy-Preserving**: Anonymous attestations protect identity while ensuring authenticity
- **Dual-Purpose Efficiency**: Every interaction serves multiple cryptographic functions simultaneously

### How the Primitive Works

The trust-minimized web of trust operates on **four fundamental layers**:

#### 1. Cryptographic Identity Layer
- **Client-Side Key Generation**: Ed25519 keypairs generated locally
- **Biometric Protection**: WebAuthn/passkeys secure private keys on-device
- **Threshold Migration**: Single keys evolve into socially-recoverable threshold signatures
- **No Personal Data**: Only cryptographic identities, never personal information

#### 2. Physical Attestation Layer
- **IRL Pairing**: QR/NFC-based secure local connections
- **Mutual Verification**: Peers simultaneously verify each other's humanity
- **Key Fragment Exchange**: FROST threshold shares distributed during attestations
- **Cryptographic Bonding**: Physical meetings create strongest trust relationships

#### 3. Social Recovery Layer
- **Guardian Networks**: Threshold signature schemes enable collaborative key recovery
- **Flexible Thresholds**: Security models adapt as social networks grow
- **Key Rotation**: Seamless guardian addition without account recreation
- **Emergency Recovery**: Rapid response to device loss or compromise

#### 4. Economic Incentive Layer
- **UBI Distribution**: Bitcoin-backed tokens reward network participation
- **Anti-Sybil Economics**: Real economic value prevents fake account creation
- **Progressive Activation**: Bitcoin deposits unlock full economic functionality
- **Network Effects**: Growing participation increases individual and collective value

### Key Innovations

**The Dual-Purpose Attestation**: Unlike any existing system, BUBIWOT attestations simultaneously serve proof-of-humanity AND threshold key recovery—maximizing the value of every real-world interaction.

**Progressive Threshold Security**: Start with simple single-device security, then incrementally upgrade to sophisticated multi-party threshold schemes as your social network grows.

**Bitcoin-Native Social Recovery**: FROST threshold signatures work directly with Bitcoin and Lightning, eliminating the need for complex smart contract systems while maintaining full programmability.

**IRL-First Trust Bonds**: Physical meetings create cryptographically verifiable trust relationships that are orders of magnitude stronger than online-only verification methods.

### Applications Beyond UBI

The trust-minimized web of trust primitive enables multiple applications:

**🏛️ Decentralized Governance**
- Sybil-resistant voting systems
- Progressive delegation based on trust networks
- Anonymous but verifiable participation

**🔐 Social Recovery Wallets**
- Threshold signature wallets for any cryptocurrency
- Cross-chain social recovery systems
- Enterprise multi-signature management

**🌐 Web of Trust Authentication**
- Password-less authentication systems  
- Decentralized identity verification
- Anonymous but trusted access control

**🤝 Peer-to-Peer Networks**
- Trust-scored marketplace systems
- Decentralized lending/borrowing protocols
- Anonymous reputation systems

### Problem Statement

Current trust and identity systems face fundamental limitations:

1. **Centralized Trust**: Existing systems require trusted authorities for verification and recovery
2. **Sybil Vulnerability**: Difficult to prevent fake accounts without invasive identity checks
3. **Recovery Complexity**: Seed phrases and hardware tokens create poor user experience
4. **Privacy Violations**: Traditional verification exposes sensitive personal information
5. **Single-Purpose Systems**: Each application requires separate identity and trust infrastructure
6. **Economic Misalignment**: No incentive mechanisms to encourage honest participation

BUBIWOT's trust-minimized web of trust addresses each challenge through cryptographic design and economic incentives.

### Vision: Layer-Zero for Human Coordination

The ultimate vision of BUBIWOT extends far beyond Universal Basic Income:

**🌍 Global Infrastructure**
- Foundational layer for any application requiring human verification
- Interoperable across all blockchain networks and traditional systems
- Censorship-resistant operation independent of any government or corporation

**🔬 Cryptographic Innovation**
- New primitive enabling previously impossible applications
- Foundation for post-password authentication systems
- Social cryptography as robust as individual cryptography

**🤝 Human-Centric Design**
- Technology that enhances rather than replaces human relationships
- Privacy-preserving systems that respect human dignity
- Progressive decentralization matching natural social network growth

**💰 Economic Sustainability**
- Self-reinforcing economic incentives prevent system degradation
- Bitcoin-backed value ensures long-term sustainability
- Network effects create positive feedback loops

### Getting Started: UBI as the First Application

While the trust-minimized web of trust enables countless applications, BUBIWOT begins with Universal Basic Income because:

- **Clear Value Proposition**: Everyone understands the benefit of basic income
- **Strong Anti-Sybil Incentives**: Real economic value prevents fake accounts
- **Natural Network Growth**: People are motivated to onboard friends and family
- **Global Relevance**: UBI appeals across all demographics and geographies

The current MVP focuses on:

- **Client-side identity generation and threshold key management**
- **IRL attestation mechanisms with dual-purpose functionality**
- **UBI allocation tracking with Bitcoin-backed value**
- **Progressive social recovery system development**
- **Foundation for the broader trust-minimized web of trust ecosystem**

### Conclusion: A New Primitive for Human Coordination

BUBIWOT represents more than a UBI system—it's the **layer-zero infrastructure** for a new era of human coordination technology. By solving the fundamental challenge of trust-minimized proof-of-personhood while simultaneously enabling robust social recovery systems, BUBIWOT creates the foundation for countless applications we haven't yet imagined.

The trust-minimized web of trust primitive promises to be as foundational to human coordination as public-key cryptography was to digital security—enabling new forms of cooperation, governance, and economic activity that respect both individual sovereignty and collective flourishing.

**The future of human coordination is cryptographic, social, and trust-minimized. BUBIWOT makes it possible.**
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