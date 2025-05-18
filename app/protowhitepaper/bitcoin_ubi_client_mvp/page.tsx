'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import MarkdownContent from '../../../components/MarkdownContent';

// Content for this document
const documentContent = `
# Bitcoin UBI Client MVP

### 1. Summary

BUBIWOT is a trust-minimized protocol that begins distributing a Bitcoin-backed UBI token (BUBI) to real humans via anonymous peer attestations. In this MVP you'll be able to:

- Create a pseudonymous account (keypair generated client-side, stored via WebAuthn/biometrics)
- Attest other users' accounts (n-of-m social graph)
- See your cumulative BUBI allocation, accruing at a fixed rate (e.g. 3% annual inflation), even before spendability

This MVP lays the groundwork for a censorship-resistant identity layer and on-chain Bitcoin-backed UBI economy.

### 2. MVP Objectives

- **Proof-of-Human Onboarding**
  - Client-side keypair generation
  - Biometric-gated private key via WebAuthn/passkeys

- **Anonymous Peer Attestations**
  - Users sign attestations for others' public keys
  - Store attestations in a shared off-chain database (e.g. PostgreSQL or IPFS)

- **UBI Allocation Engine**
  - Daily allocation of "virtual" BUBI tokens per verified account
  - Inflation schedule: 3% APR, prorated per second

- **Dashboard & API**
  - Next.js front-end to view attestations and BUBI balance
  - REST API for fetching attestations & allocations

### 3. System Architecture

\`\`\`
flowchart LR
  subgraph Client
    A[Next.js SPA] --> B[WebAuthn Keypair]
    B --> C[LocalStorage.Encrypted]
    A --> D[Dashboard UI]
  end
  subgraph Backend
    E[API Server(Node.js + Express)]
    F[(Attestation DBPostgres/IPFS)]
    G[(Allocation Engine)]
    E --> F
    E --> G
    G --> H[(UBI Ledger DB)]
  end
  Client -->|1. Register/Attest| E
  Client -->|2. Fetch Balance| E
\`\`\`

- **Client (Next.js)**
  - Onboarding: prompt biometric via WebAuthn → generate/sign keypair
  - Attest: sign another user's pubkey + timestamp → POST /attest

- **API Server**
  - /register: stores pubkey + minimal profile metadata
  - /attest: validates signature + writes to attestations table or IPFS
  - /balance: computes accrued BUBI from UBI Ledger DB

- **Allocation Engine**
  - (client/user pulls credited funds to personal account):
    - Count verified accounts
    - Mint new BUBI into BUBI treasury
    - Credit portion of withdraw to puller's account pro rata into UBI Ledger DB

### 4. Identity & Attestations

- **Keypair**: Ed25519 generated client-side
- **Storage**: private key encrypted with WebAuthn credential
- **Attestation Record**:

\`\`\`json
{
  "issuer":   "pubkey_A",
  "subject":  "pubkey_B",
  "sig":      "sign_A(subject||timestamp)",
  "ts":       "ISO8601 timestamp"
}
\`\`\`

- **Sybil Resistance**: require each new account to collect ≥ k attestations from unique issuers before "verified"

### 5. UBI Token Allocation

- **Virtual Balance**: not spendable in MVP, visible only
- **Inflation**: 3% APR, continuous, minted regularly
- **Distribution**: equal per verified account
- **Ledger**: simple time-series table of allocations

### 6. Data Privacy & Storage

- **Off-chain attestation store**: Postgres for MVP (move to IPFS/Filecoin later)
- **Public audit**: read-only API endpoints for verifiers
- **No personal data**: only pubkeys & attestations

### 7. Security & UX

- **Biometric gating** via WebAuthn/passkeys ensures private keys never leave device
- **"One-click" attest**: tap user's profile → confirm biometric → attest
- **Simple dashboard**: show your BUBI balance, pending attestations, total network supply

### 8. User Flow

- **Register**
  - Visit /register → prompt biometric → generate pubkey → POST to backend

- **Verify Peers**
  - Scan QR or share profile link → click "Attest" → biometric → send attestation

- **View Balance**
  - Dashboard polls /balance → displays accrued BUBI, network stats

### 9. Roadmap (Post-MVP)

- **On-chain anchoring**: commit attestation roots via Bitcoin OP_RETURN
- **Spendability**: mint real BUBI on a sidechain or LN token layer
- **Reputation scoring**: weight attestations by issuer reputation
- **Social recovery**: n-of-m attestations to recover lost keys

### 10. Conclusion

This MVP proves out the core primitives—anonymous peer attestations and Bitcoin-backed UBI accrual—laying the foundation for a forkless, censorship-resistant identity and basic-income protocol. Once adoption and security are validated, we'll bridge into on-chain settlement and full token utility.
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
          href="https://github.com/3obby/bubiwotsite/edit/main/documents/protowhitepaper/bitcoin-ubi-client-mvp.md"
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