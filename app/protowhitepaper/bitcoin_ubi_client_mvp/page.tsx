'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `
# Bitcoin UBI Client MVP with Threshold Social Recovery

### 1. Summary

BUBIWOT is a trust-minimized protocol that distributes Bitcoin-backed UBI tokens (BUBI) to real humans via **IRL peer attestations** that simultaneously enable **threshold social recovery**. In this MVP you'll be able to:

- Create a pseudonymous account (keypair generated client-side, stored via WebAuthn/biometrics)
- **IRL Attest** other users' accounts via QR/NFC pairing (dual-purpose: UBI verification + key fragment exchange)
- See your cumulative BUBI allocation, accruing at a fixed rate (e.g. 3% annual inflation)
- **Incrementally decentralize** your account security through threshold cryptography
- **Socially recover** lost accounts via trusted peer collaboration

This MVP proves the core primitives for a censorship-resistant identity layer, social recovery system, and Bitcoin-backed UBI economy.

### 2. MVP Objectives

- **Proof-of-Human Onboarding**
  - Client-side keypair generation
  - Biometric-gated private key via WebAuthn/passkeys
  - **Progressive decentralization**: start with single device, upgrade to threshold security

- **IRL Peer Attestations (Dual Purpose)**
  - **UBI Verification**: Sign attestations for others' humanity/uniqueness
  - **Key Fragment Exchange**: Generate and exchange threshold signature shares (FROST/Shamir)
  - Store attestations in shared off-chain database (PostgreSQL/IPFS)

- **UBI Allocation Engine**
  - Daily allocation of BUBI tokens per verified account
  - Inflation schedule: 3% APR, prorated per second
  - **Account Activation**: deposit Bitcoin to unlock spendable BUBI

- **Threshold Social Recovery**
  - **Incremental Guardian Addition**: add trusted peers over time
  - **Flexible Thresholds**: 2-of-3 initially, expand to 3-of-5, etc.
  - **Key Rotation**: seamlessly integrate new guardians without account recreation

- **Dashboard & API**
  - Next.js front-end showing BUBI balance, guardian status, recovery options
  - REST API for attestations, allocations, and threshold operations

### 3. System Architecture

\`\`\`
flowchart LR
  subgraph Client
    A[Next.js PWA] --> B[WebAuthn Keypair]
    B --> C[LocalStorage.Encrypted]
    A --> D[Dashboard UI]
    A --> E[QR/NFC Pairing]
    A --> F[Threshold Key Manager]
    F --> G[FROST Signatures]
  end
  subgraph Backend
    H[API Server Node.js]
    I[(Attestation DB)]
    J[(UBI Allocation Engine)]
    K[(Guardian Registry)]
    L[(Threshold Coordinator)]
    H --> I
    H --> J
    H --> K
    H --> L
    J --> M[(BUBI Ledger)]
  end
  subgraph Bitcoin Layer
    N[Lightning Network]
    O[Babylon Sidechain]
    P[Bitcoin Mainchain]
  end
  Client -->|1. Register/Attest/Fragment| H
  Client -->|2. Fetch Balance/Status| H
  Client -->|3. Activate Account| N
  H -->|4. Anchor Attestations| P
\`\`\`

### 4. IRL Attestation Flow (Dual Purpose)

**Step 1: Initial Setup**
- Generate Ed25519 keypair client-side
- Store private key encrypted with WebAuthn
- Register public key with backend

**Step 2: First IRL Attestation (with Peer A)**
- Open app, tap "New Attestation"
- Generate ephemeral pairing key → QR code
- Peer scans QR, establishes secure local connection
- **Dual Exchange**:
  - **UBI Attestation**: Sign each other's pubkeys for humanity verification
  - **Key Fragment**: Generate 2-of-2 threshold shares using FROST
- Store attestation in backend, key fragments locally (encrypted)

**Step 3: Second IRL Attestation (with Peer B)**
- Repeat pairing process with second peer
- **Threshold Upgrade**: Rotate to 2-of-3 scheme
- Now have: 2 guardians + original device key
- **Account Verification**: ≥2 attestations = verified for UBI

**Step 4: Account Activation**
- Deposit Bitcoin into Lightning channel or Babylon sidechain
- Trigger threshold key migration (funds move to socially-recoverable address)
- Original single-device key archived/deleted
- **BUBI Unlocked**: virtual balance becomes spendable

**Step 5: Incremental Decentralization**
- Add Peer C, D, etc. over time
- Each addition rotates threshold (2-of-3 → 3-of-5 → etc.)
- Flexible guardian management without account recreation

### 5. Identity & Attestation Records

**Attestation Record (UBI Verification)**:
\`\`\`json
{
  "issuer": "pubkey_A",
  "subject": "pubkey_B", 
  "sig": "sign_A(subject||timestamp||nonce)",
  "ts": "ISO8601 timestamp",
  "attestation_type": "humanity_verification"
}
\`\`\`

**Guardian Record (Threshold Recovery)**:
\`\`\`json
{
  "account": "pubkey_primary",
  "guardian": "pubkey_guardian",
  "threshold_share": "encrypted_key_fragment",
  "threshold_config": "2-of-3",
  "sig": "sign_both(guardian_agreement)",
  "ts": "ISO8601 timestamp"
}
\`\`\`

### 6. UBI Token Allocation

- **Virtual Phase**: BUBI balance visible but not spendable
- **Activation Threshold**: ≥2 attestations + Bitcoin deposit
- **Inflation**: 3% APR, continuous minting
- **Distribution**: equal allocation per verified account
- **Spendability**: Lightning/Babylon integration for real transactions

### 7. Threshold Social Recovery

**Recovery Scenarios**:
- **Device Loss**: Guardians collaborate to sign recovery transaction
- **Guardian Loss**: Remaining guardians help rotate threshold
- **Compromise**: Emergency key rotation with guardian consensus

**Recovery Process**:
1. User initiates recovery from new device
2. Proves identity to threshold of guardians (IRL/video/etc.)
3. Guardians collaboratively sign recovery transaction using FROST
4. New device key replaces compromised key
5. Threshold rotated to include new key

### 8. Security & UX Innovations

- **Progressive Security**: Start simple (single device) → upgrade to threshold
- **IRL-First**: Physical meetings create strongest attestation bonds
- **Dual-Purpose Meetings**: One IRL interaction serves both UBI + recovery
- **Flexible Thresholds**: Adapt security model as social graph grows
- **Bitcoin-Native**: FROST signatures work directly with Bitcoin/Lightning

### 9. User Journey

**Phase 1: Solo Start**
- Install PWA → generate keys → basic UBI accrual (virtual only)

**Phase 2: First Guardian** 
- Meet friend IRL → mutual attestation + key fragment exchange
- Still single-device control, but recovery option exists

**Phase 3: Account Activation**
- Second IRL attestation → verified status
- Deposit Bitcoin → unlock spendable BUBI
- Threshold security activated (2-of-3)

**Phase 4: Network Growth**
- Additional IRL meetings → more guardians
- Stronger threshold security (3-of-5, 4-of-7, etc.)
- Richer social attestation graph

### 10. Technical Stack

**Cryptography**:
- **FROST** (threshold Schnorr signatures) for Bitcoin-native recovery
- **Shamir's Secret Sharing** for flexible key fragmentation
- **Ed25519** for attestation signatures
- **WebAuthn** for biometric key protection

**Infrastructure**:
- **Next.js PWA** with offline capability
- **QR/NFC** for secure local pairing
- **Lightning Network** for micropayments
- **Babylon** for programmable Bitcoin contracts
- **IPFS** for decentralized attestation storage

### 11. Roadmap Integration

**MVP (Current)**:
- IRL attestations (dual-purpose)
- Virtual BUBI accrual
- Basic threshold recovery (2-of-3)

**Phase 2**:
- Lightning integration
- Spendable BUBI tokens
- Advanced threshold management

**Phase 3**:
- Babylon smart contracts
- On-chain attestation anchoring
- Cross-chain UBI distribution

**Phase 4**:
- Reputation-weighted attestations
- Automated threshold adjustments
- Global UBI network effects

### 12. Unique Value Proposition

This merged approach is genuinely novel:

**vs. Existing Social Recovery** (Argent, Casa, etc.):
- **IRL-First**: Physical attestations create stronger trust bonds
- **Dual Purpose**: One meeting serves both UBI verification + key recovery
- **Bitcoin-Native**: FROST signatures work directly with Bitcoin/Lightning
- **Incremental**: Add guardians over time without account recreation

**vs. Existing UBI Systems**:
- **Cryptographic Sybil Resistance**: Threshold attestations prevent fake accounts
- **Self-Sovereign**: No central authority controls distribution
- **Bitcoin-Backed**: Real economic value, not just social tokens

**vs. Traditional Wallets**:
- **Progressive Decentralization**: Start simple, upgrade security incrementally
- **Social-First**: Recovery through trusted relationships, not seed phrases
- **UBI Integration**: Account security directly tied to economic participation

### 13. Conclusion

By merging UBI attestations with threshold social recovery, BUBIWOT creates a unique system where **every IRL interaction serves dual purposes**: proving humanity for economic participation AND building cryptographic social safety nets.

This approach solves multiple problems simultaneously:
- **Sybil-resistant UBI** through physical attestations
- **User-friendly recovery** through trusted social relationships  
- **Progressive security** that grows with your social network
- **Bitcoin-native implementation** using FROST threshold signatures

The result is a trust-minimized protocol that makes Bitcoin-backed UBI both economically sound and socially recoverable—laying the foundation for a truly decentralized basic income system.
`;

export default function BitcoinUbiClientMvp() {
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