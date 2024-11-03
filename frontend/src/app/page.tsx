// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import IncomingTransfers from '@/components/IncomingTransfers';

export default function Home() {
  const { account, connectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('documents');

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">GovChain Document Management</h1>
          {!account ? (
            <button
              onClick={connectWallet}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          ) : (
            <p className="text-foreground/80">
              Connected: {truncateAddress(account)}
            </p>
          )}
        </div>

        {account && (
          <>
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'documents' 
                    ? 'btn-primary' 
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                }`}
              >
                My Documents
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'upload' 
                    ? 'btn-primary' 
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                }`}
              >
                Upload Document
              </button>
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'incoming' 
                    ? 'btn-primary' 
                    : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                }`}
              >
                Incoming Transfers
              </button>
            </div>

            <div className="card p-6">
              {activeTab === 'documents' && <DocumentList />}
              {activeTab === 'upload' && <DocumentUpload />}
              {activeTab === 'incoming' && <IncomingTransfers />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}