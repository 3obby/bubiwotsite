'use client';

import React from 'react';
import Link from 'next/link';

export default function ProtoWhitepaper() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-gray-100">
        <Link href="/" className="text-sm font-extralight tracking-wider text-gray-600">
          bubiwot
        </Link>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">bubiwot protocol whitepaper</h1>
          <p className="text-gray-800 mb-8">
            welcome to the bubiwot protocol whitepaper and associated research documents. 
            these documents are maintained as a collaborative effort and are open for community contributions.
          </p>
          
          {/* GitHub edit button */}
          <a
            href="https://github.com/3obby/bubiwotsite/tree/main/app/protowhitepaper"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-gray-700 hover:text-blue-600 mb-8"
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
          
          <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">table of contents</h2>
          
          {/* ASCII-style tree navigation */}
          <div className="font-mono text-gray-800 bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <div className="text-lg mb-2 font-semibold">bubiwot protocol docs</div>
            <div className="ml-4">
              ├── <a href="/pdf/BUBIWOT_LITEPAPERv7.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">BUBIWOT Litepaper</a>
              <div className="text-gray-700 ml-4 text-sm">intro</div>
            </div>  <div className="ml-4">
              ├── <Link href="/protowhitepaper/bitcoin_ubi_client_mvp" className="text-blue-700 hover:underline">bitcoin_ubi_client_mvp</Link>
              <div className="text-gray-700 ml-4 text-sm">proposed mobile-first banking/attestation</div>
            </div>
            <div className="ml-4">
              ├── <Link href="/protowhitepaper/peers_as_keys" className="text-blue-700 hover:underline">peers_as_keys</Link>
              <div className="text-gray-700 ml-4 text-sm">social/peer irl guardians</div>
            </div>
            <div className="ml-4">
              ├── <Link href="/protowhitepaper/incentivizing_social_graphs" className="text-blue-700 hover:underline">incentivizing_social_graphs</Link>
              <div className="text-gray-700 ml-4 text-sm">economic security model</div>
            </div>
            <div className="ml-4">
              └── <Link href="/protowhitepaper/proposed_research_direction" className="text-blue-700 hover:underline">proposed_research_direction</Link>
              <div className="text-gray-700 ml-4 text-sm"></div>
            </div>
          </div>
          
          <div className="mt-12 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold mb-2 text-gray-900">about this document</h2>
            <p className="text-gray-800">
              this is a living document that will evolve with the bubiwot protocol. 
              all community members are encouraged to contribute by using the &quot;edit on github&quot; 
              link at the top of each page.
            </p>

            
            
            <div className="mt-4">
              <Link 
                href="/"
                className="flex items-center text-sm text-blue-700 hover:underline"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                back to home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 