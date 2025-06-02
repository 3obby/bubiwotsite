"use client";
import React, { useState, useRef } from "react";

// Mermaid Diagram Component - Simple Button to Modal
const MermaidDiagram = React.memo(function MermaidDiagram() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const expandedDiagramRef = useRef<HTMLDivElement>(null);

  const diagramDefinition = `
   graph TD
  subgraph User Device Environment
    Smartphone[Smartphone Device] --> WebApp[Next.js PWA WebApp]
    WebApp --> LocalStorage[Secure Local Storage<br/>Keys & Recovery Shards]
    WebApp --> LocalSigning[Secure Transaction Signing<br/>WebCrypto & Secure Enclave]
  end

  subgraph Peer-to-Peer IRL Interactions
    WebApp -->|IRL| QRKeyswap[IRL Key Shard Swap & Attestation via QR]
    QRKeyswap --> SocialRecovery[Social Recovery & Key Recovery<br/>Threshold Crypto]
    SocialRecovery -->|Enables secure recovery| LocalStorage
    SocialRecovery --> TrustScores[Dynamic Trust Score Calculation<br/>Web-of-Trust]
  end

  subgraph Bitcoin & Token Economy
    Bitcoin -->|Lock via| Babylon[Babylon Bitcoin Finality Layer]
    Babylon -->|Mint backed tokens| UBITokens[Bitcoin-Backed UBI Tokens]
    UBITokens -->|Distributed regularly| WebApp
    UBITokens -->|Spend & Incentivize| TokenUtility[Tokens used to Post, Rank & Recover]
  end

  subgraph Decentralized Public Message Board
    MessageBoard[Public Content & Discussions]
    TokenUtility -->|Rank content| MessageBoard
    TrustScores -->|Filter content visibility| MessageBoard
    MessageBoard -->|Anchored hashes| Babylon
  end

  %% Connections %%
  WebApp -->|P2P Communication| MessageBoard
  QRKeyswap -->|Establishes trust & recovery| SocialRecovery
  TokenUtility -->|Reward peers| SocialRecovery

  %% Trust boundaries styling %%
  classDef local fill:#E3F2FD,stroke:#0D47A1,color:#0D47A1
  classDef p2p fill:#FFF8E1,stroke:#FF6F00,color:#FF6F00
  classDef blockchain fill:#E8F5E9,stroke:#1B5E20,color:#1B5E20

  %% Apply classes to individual nodes %%
  class Smartphone,WebApp,LocalStorage,LocalSigning local
  class QRKeyswap,SocialRecovery,TrustScores,MessageBoard p2p
  class Bitcoin,Babylon,UBITokens,TokenUtility blockchain
  `;
  
  // Load mermaid diagram for modal
  const loadMermaidDiagram = async () => {
    if (!expandedDiagramRef.current) return;
    
    console.log('Loading Mermaid diagram for modal');
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('Importing mermaid...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout - took too long')), 10000)
      );
      
      // Dynamic import to reduce initial bundle size
      const mermaid = await Promise.race([
        import('mermaid').then(m => m.default),
        timeoutPromise
      ]) as typeof import('mermaid').default;
      
      console.log('Mermaid imported successfully');
      
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '14px',
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#e5e7eb',
          lineColor: '#6b7280',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#ffffff',
          background: '#ffffff',
          mainBkg: '#ffffff',
          secondBkg: '#f9fafb',
          tertiaryBkg: '#f3f4f6',
        },
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: false,
          htmlLabels: true,
          curve: 'basis'
        }
      });

      console.log('Rendering mermaid diagram...');
      const renderPromise = mermaid.render('mermaid-diagram-modal', diagramDefinition);
      const renderResult = await Promise.race([
        renderPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Render timeout - diagram too complex')), 8000)
        )
      ]);
      
      console.log('Mermaid diagram rendered successfully');
      
      if (expandedDiagramRef.current) {
        expandedDiagramRef.current.innerHTML = renderResult.svg;
        
        // Ensure SVG is mobile-friendly
        const svg = expandedDiagramRef.current.querySelector('svg');
        if (svg) {
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
          svg.style.touchAction = 'pan-x pan-y pinch-zoom';
          // Remove any fixed width/height attributes that might interfere with mobile scaling
          svg.removeAttribute('width');
          svg.removeAttribute('height');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        
        console.log('SVG inserted into DOM');
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading Mermaid:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load diagram');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the modal
  const handleOpenModal = () => {
    setIsExpanded(true);
    
    // Load diagram when modal opens
    setTimeout(() => {
      loadMermaidDiagram();
    }, 100);
  };

  // Handle retry on error
  const handleRetry = () => {
    loadMermaidDiagram();
  };

  return (
    <>
      {/* Simple Button */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        System Diagram
      </button>

      {/* Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">BUBIWOT System Architecture</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-auto bg-white" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
              <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                {isLoading && (
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Loading diagram...</p>
                    <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
                  </div>
                )}
                {loadError && (
                  <div className="text-center text-red-500">
                    <p className="text-sm mb-4">Failed to load diagram: {loadError}</p>
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {!isLoading && !loadError && !isLoaded && (
                  <div className="text-center text-gray-400">
                    <p className="text-lg mb-4">Diagram not loaded yet</p>
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Load Diagram
                    </button>
                  </div>
                )}
                <div 
                  ref={expandedDiagramRef} 
                  className="w-full h-auto flex justify-center"
                  style={{ 
                    minHeight: '200px',
                    touchAction: 'pan-x pan-y pinch-zoom'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MermaidDiagram; 