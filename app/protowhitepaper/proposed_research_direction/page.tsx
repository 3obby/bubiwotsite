'use client';

import React from 'react';
import Link from 'next/link';
import MarkdownContent from '@/components/MarkdownContent';

// Content for this document with markdown styling
const documentContent = `

## Table of Contents: BUBIWOT Protocol Research 

### I. Introduction and Core Principles

**Vision and Goals:**  
Establish a sovereign, user-governed, resilient ecosystem integrating Bitcoin, social reputation, and UBI.  
Aim for durability, trust-minimization, decentralization, and sovereignty.

**Core Components Synergy:**  
Detail the interconnectedness of human-only IRL attestations, positive-sum economics with Bitcoin, reputation-weighted filtering, and scalable P2P architecture.  
Robust identity underpins reputation, which influences filtering and economic incentives.

**Overarching Principle - Trust Minimization:**  
Emphasize reducing reliance on central authorities and trusted third parties by leveraging cryptography, decentralized consensus, and transparent mechanisms.

### II. Foundational Layers

#### A. Identity Layer: Proof-of-Personhood (PoP) & Attestations

- **Human-Only IRL Attestations:**  
  Define mechanisms for verifying unique human participants without relying on liveness checks.  
  This is the bedrock of Sybil resistance and system integrity.

- **Sybil Resistance:**  
  Address long-term resistance against evolving AI capabilities; the strength of PoP mechanisms impacts Sybil attack difficulty.

- **P2P Attestation Protocols:**  
  Design secure, usable, privacy-preserving protocols for mobile environments that resist collusion and spoofing.

- **Zero-Knowledge (ZK) Proof Integration:**  
  Utilize ZK-Proofs for location sharing to enhance verification while preserving privacy.  
  Explore advanced cryptographic techniques for identity and reputation verification.  
  *(If location is even deemed necessary... better to build "too secure" than "not secure enough")*

- **Non-Biometric Validation:**  
  Investigate robust and user-friendly methods for human validation.

#### B. Social Graph Layer: Web of Trust (WoT)

- **WoT Structure:**  
  Design a dynamic, chain-of-referrer based WoT as a directed graph where reputation flows between nodes.

- **Topology & Vulnerabilities:**  
  Analyze network properties to detect suspicious patterns characteristic of Sybil farms or collusion.

- **Gamified Incentives:**  
  Create multi-level incentives that balance reward-seeking behavior with genuine trust connections.

#### C. Reputation Layer: Dynamic & Multi-Faceted Scoring

- **Reputation Scoring Algorithms:**  
  Develop dynamic systems inspired by PageRank/EigenTrust and SourceCred's graph flow logic.

- **Temporal Decay:**  
  Implement decay mechanisms so that past stakes and attestations lose influence over time.

- **Multi-Faceted Modeling:**  
  Represent reputation as a multi-dimensional profile (stake reliability, attestation honesty, WoT centrality, community contribution) with clear aggregation methods.

- **Normalization and Aggregation:**  
  Normalize disparate inputs using techniques like min-max scaling or z-score normalization.

- **Anti-Plutocracy Mechanisms:**  
  Limit wealth influence through non-linear utility functions and demurrage on reputation.

- **Sybil Resistance in Attestations:**  
  Enhance resistance by leveraging PoP strengths and social graph analysis with algorithms like SybilGuard/SybilRank.

### III. Economic Layer: Tokenized UBI & Incentives

#### A. Bitcoin Integration & Staking

- **Bitcoin-Backed Economic Identities:**  
  Use Bitcoin-backed stakes to establish "skin-in-the-game" endorsements tied to referee legitimacy.

- **Connecting Off-Chain Attestations to BTC Value:**  
  Develop mechanisms linking off-chain P2P attestations to Bitcoin staking/slashing, potentially via L2 solutions.

- **Collateralization & Proof-of-Reserves (PoR):**  
  Ensure that UNIT tokens are verifiably backed by locked Bitcoin collateral, possibly leveraging decentralized oracles.

- **Secure Minting:**  
  Implement "Secure Mint" logic to programmatically verify PoR data before issuing new tokens.

#### B. UBI Tokenomics & Stability

- **UBI Token Issuance Model:**  
  Design the token model for UNIT that represents a claim on or is backed by staked Bitcoin.

- **Economic Stability & Value:**  
  Develop strategies to counteract inflationary pressures from continuous UBI distribution and to create demand for UNIT.

- **Demurrage:**  
  Incorporate a holding fee to discourage hoarding.

- **Transaction Fee Redistribution:**  
  Use UNIT transfer fees to provide a sink or recirculation mechanism.

- **Creating Structural Demand:**  
  Develop mechanisms that require UNIT for platform services (e.g., communication, storage, governance).

- **Yield-Backed Value Support:**  
  Explore using yields from staked Bitcoin or ecosystem fees to buy back and burn UNIT tokens.

- **Reputation-Weighted Distribution:**  
  Tie a user's UNIT distribution to their multi-faceted reputation score with a baseline allotment for all verified humans.

#### C. Ranked Speech & Market Dynamics

- **Fee Structure:**  
  Design fee models for auctions that balance revenue generation with accessibility.

- **Auction Model Design:**  
  Research and select auction models (e.g., based on GSP auctions) integrated with the reputation system.

- **Market Dynamics Modeling:**  
  Model demand dynamics for ranked speech and adjust auction parameters to maintain content diversity.

- **Bitcoin L2 Integration:**  
  Implement these auction and fee structures on a suitable Bitcoin Layer 2.

#### D. Slashing & Economic Disincentives

- **Robust Slashing Mechanisms:**  
  Develop chain-aware slashing tied to referral structures, where the referrer's stake is linked to the referee's legitimacy.

- **Game-Theoretic Foundations:**  
  Apply game theory (e.g., Prisoner's Dilemma) to design deterrents where honesty is the optimal strategy.

- **Cost-of-Corruption Analysis:**  
  Conduct formal analyses for optimal economic deterrence parameters.

### IV. System Architecture & Functionality

#### A. Peer-to-Peer (P2P) Network & Scalability

- **Architecture Design:**  
  Create a scalable P2P network capable of supporting a large user base (e.g., 300 million US users).

- **Challenges:**  
  Address issues in network architecture, data management, and mobile resource constraints.

- **Resilience:**  
  Ensure the design is decentralized, resilient, and censorship-resistant.

#### B. Decentralized Services

- **Sovereign Banking:**  
  Develop methods for user self-custody of staked BTC and UNIT tokens.

- **Secure Communication:**  
  Evaluate integrations with censorship-resistant P2P messaging protocols using DID/reputation systems.

- **Data Indexing & Provenance:**  
  Research architectures for decentralized data indexing tied to DIDs and blockchain-backed timestamping.

- **Authorship & Data Permanence:**  
  Explore cryptographic attestations and decentralized storage (e.g., IPFS) for verifiable authorship and permanence.

#### C. Trust-Minimized Social Recovery

- **Protocol Design:**  
  Design protocols enabling account recovery through M-of-N attestations from a user's WoT-selected guardians.

- **Leveraging Reputation:**  
  Incorporate reputation to require minimum guardian reputations and weight attestations.

- **Trust Minimization:**  
  Ensure guardians only authorize pre-defined actions without controlling funds or keys.

- **Security Analysis:**  
  Analyze potential attack vectors including collusion, coercion, and social engineering.

### V. Trust Minimization & Security Analysis

#### A. Overarching Principles

- **Security-First Culture:**  
  Integrate security from the start with ongoing internal reviews and external audits.

- **Holistic Vulnerability Analysis:**  
  Conduct comprehensive system-wide analyses.

#### B. Component Integration & Interoperability

- **Defining Interfaces:**  
  Establish clear APIs and data formats (e.g., using DIDs, VCs, EAS) for module intercommunication.

- **Cross-Chain Communication:**  
  Design protocols for IBC interactions, especially in Cosmos SDK-based L2 environments.

#### C. Security Assessment & Audits

- **Security Audit Reports:**  
  Plan for and include summaries of future security audits.

### VI. Research Challenges & Future Roadmap

#### A. Identified Challenges & Dependencies

- Summarize key research challenges such as balancing PoP requirements and linking off-chain attestations to L2 value.  
- Outline external dependencies like Bitcoin L1 features, L2 security, ZKP advancements, secure hardware, and regulatory clarity.

#### B. Phased Approach & Next Steps

- **Proposed Phased R&D:**  
  Recommend a phased approach from foundational research to pilot testing.
  
- **Specialized Research Sub-Teams:**  
  Dedicate teams to focus on Identity/ZK, P2P/Scalability, Tokenomics/L2, WoT/Reputation/Filtering, and Client-Side Security/UX.
  
- **Detailed Proof-of-Concept (PoC) Plans:**  
  Develop detailed PoC plans for the highest-risk components.
  
- **Community Engagement & Iterative Development:**  
  Foster collaborations and adopt an agile approach with clear success metrics (e.g., Sybil infiltration rate, maximum nodes supported).

#### C. Future Research Directions

- **Advanced Graph-Theoretic Algorithms:**  
  For collusion detection.
  
- **Formal Game-Theoretic Modeling:**  
  In chain-of-referrer contexts.
  
- **Privacy-Preserving Cryptoeconomics.**
  
- **Empirical Studies and Simulations:**  
  Such as agent-based modeling.
  
- **Comparative Staking Analysis:**  
  Between BTC and native tokens.
  
- **User-Friendly Non-Biometric Validation & Decentralized Governance Mechanisms.**

### VII. Content Moderation: WoT Reputation-Weighted Comment Filtering

- **Objective:**  
  Foster healthy discourse, resist spam, and improve content quality.

- **Dynamic WoT Basis:**  
  Utilize the WoT reputation system for filtering.

- **Challenges:**  
  Address subjective definitions of "good" vs. "spam" and avoid majoritarian bias.

- **Application to Filtering:**  
  Weight the visibility of comments based on reputation scores.

- **Dispute Resolution:**  
  Consider lightweight, reputation-gated review mechanisms for transparent, trust-minimized dispute resolution.
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
          href="https://github.com/3obby/bubiwotsite"
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