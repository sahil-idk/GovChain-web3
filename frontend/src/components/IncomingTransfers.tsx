// src/components/IncomingTransfers.tsx
'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';

interface Document {
  tokenId: string;
  ipfsHash: string;
  owner: string;
  pendingOwner: string;
  ownerApproved: boolean;
  govtApproved: boolean;
}

export default function IncomingTransfers() {
  const { contract, account } = useWeb3();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTransfers, setCompletedTransfers] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isEmptyAddress = (address: string) => {
    return address === '0x0000000000000000000000000000000000000000';
  };

  const fetchIncomingTransfers = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const incomingDocs = [];
      const completed: any[] = [];
      let tokenId = 1;
      const maxAttempts = 20;
      let failedAttempts = 0;

      while (failedAttempts < 3 && tokenId <= maxAttempts) {
        try {
          const doc = await contract.getDocument(tokenId);
          if (!isEmptyAddress(doc.owner)) {
            const currentUserAddress = account.toLowerCase();
            
            // Check for pending transfers to current user
            if (doc.pendingOwner && 
                doc.pendingOwner.toLowerCase() === currentUserAddress) {
              incomingDocs.push({
                tokenId: tokenId.toString(),
                ipfsHash: doc.ipfsHash,
                owner: doc.owner,
                pendingOwner: doc.pendingOwner,
                ownerApproved: doc.ownerApproved,
                govtApproved: doc.govtApproved
              });

              // If both approvals are complete, mark for completion
              if (doc.ownerApproved && doc.govtApproved) {
                completed.push(doc.tokenId.toString());
              }
            }
            // Check if this was a recently completed transfer
            else if (doc.owner.toLowerCase() === currentUserAddress &&
                     !doc.pendingOwner && 
                     completedTransfers.includes(tokenId.toString())) {
              incomingDocs.push({
                tokenId: tokenId.toString(),
                ipfsHash: doc.ipfsHash,
                owner: doc.owner,
                pendingOwner: doc.pendingOwner,
                ownerApproved: false,
                govtApproved: false
              });
            }
            failedAttempts = 0;
          } else {
            failedAttempts++;
          }
        } catch (error: any) {
          if (error.message.includes("nonexistent token")) {
            failedAttempts++;
          } else {
            console.error(`Error fetching document ${tokenId}:`, error);
          }
        }
        tokenId++;
      }
      setDocuments(incomingDocs);
      setCompletedTransfers(prev => [...prev, ...completed]);
    } catch (error) {
      console.error('Error fetching incoming transfers:', error);
      setError('Failed to fetch incoming transfers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates when there are pending transfers
  useEffect(() => {
    const hasPendingTransfers = documents.some(doc => 
      doc.pendingOwner && (doc.ownerApproved || doc.govtApproved)
    );

    if (hasPendingTransfers) {
      const interval = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [documents]);

  // Fetch documents when refresh is triggered
  useEffect(() => {
    fetchIncomingTransfers();
  }, [contract, account, refreshTrigger]);

  const getIpfsUrl = (ipfsHash: string) => {
    if (ipfsHash.startsWith('ipfs://')) {
      const hash = ipfsHash.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    return ipfsHash;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to determine document status and style
  const getDocumentStatus = (doc: Document) => {
    if (!doc.pendingOwner) {
      return {
        status: 'Transferred',
        className: 'bg-green-50 border-green-200',
        badge: 'bg-green-100 text-green-800'
      };
    }
    if (doc.ownerApproved && doc.govtApproved) {
      return {
        status: 'Transfer Complete',
        className: 'bg-green-50 border-green-200',
        badge: 'bg-green-100 text-green-800'
      };
    }
    return {
      status: 'Pending Transfer',
      className: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800'
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-6">Incoming Transfers</h2>

      {documents.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No incoming transfers found.
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => {
            const { status, className, badge } = getDocumentStatus(doc);
            return (
              <div key={doc.tokenId} 
                   className={`rounded-lg shadow p-6 border ${className} transition-all duration-500 ease-in-out`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">Document #{doc.tokenId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${badge}`}>
                      {status}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>IPFS Hash: 
                      <a 
                        href={getIpfsUrl(doc.ipfsHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:text-blue-600"
                      >
                        View Document
                      </a>
                    </p>
                    <p>
                      {doc.pendingOwner ? 'Current Owner' : 'Previous Owner'}: {truncateAddress(doc.owner)}
                    </p>
                  </div>

                  {doc.pendingOwner && (
                    <div className="mt-4 bg-white p-3 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold mb-2">Transfer Status</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${doc.ownerApproved ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span>Owner: {doc.ownerApproved ? 'Approved' : 'Pending'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${doc.govtApproved ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span>Government: {doc.govtApproved ? 'Approved' : 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {doc.ownerApproved && doc.govtApproved && doc.pendingOwner && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200 animate-pulse">
                      <p className="text-green-800 text-sm font-medium">
                        Transfer is approved! The document will be transferred to your account soon.
                      </p>
                    </div>
                  )}

                  {!doc.pendingOwner && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 text-sm font-medium">
                        Transfer completed! This document is now in your ownership.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}