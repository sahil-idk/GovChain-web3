// src/components/DocumentList.tsx
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

export default function DocumentList() {
  const { contract, account } = useWeb3();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');

  const isEmptyAddress = (address: string) => {
    return address === '0x0000000000000000000000000000000000000000';
  };

  const isGovernmentAccount = (address: string | null) => {
    if (!address) return false;
    return address.toLowerCase() === process.env.NEXT_PUBLIC_GOVT_ADDRESS?.toLowerCase();
  };

  const fetchDocuments = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const docs = [];
      let tokenId = 1;
      const maxAttempts = 20;
      let failedAttempts = 0;
      const isGovt = isGovernmentAccount(account);

      while (failedAttempts < 3 && tokenId <= maxAttempts) {
        try {
          const doc = await contract.getDocument(tokenId);
          if (!isEmptyAddress(doc.owner)) {
            const documentOwner = doc.owner.toLowerCase();
            const currentUser = account.toLowerCase();
            
            // Show documents if:
            // 1. User is government (show all documents with pending transfers)
            // 2. User is owner
            // 3. User is pending owner
            if (isGovt ||
                documentOwner === currentUser || 
                (doc.pendingOwner && doc.pendingOwner.toLowerCase() === currentUser) ||
                (!isEmptyAddress(doc.pendingOwner) && !doc.govtApproved)) {
              docs.push({
                tokenId: tokenId.toString(),
                ipfsHash: doc.ipfsHash,
                owner: doc.owner,
                pendingOwner: doc.pendingOwner,
                ownerApproved: doc.ownerApproved,
                govtApproved: doc.govtApproved
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
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [contract, account]);

  const handleApprove = async (tokenId: string) => {
    if (!contract || !account) return;
    try {
      setError(null);
      const tx = await contract.approveTransferAsOwner(tokenId);
      await tx.wait();
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error approving transfer:', error);
      setError('Failed to approve transfer. Please try again.');
    }
  };

  const handleGovtApprove = async (tokenId: string) => {
    if (!contract || !account) return;
    try {
      setError(null);
      const tx = await contract.approveTransferAsGovt(tokenId);
      await tx.wait();
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error approving as government:', error);
      setError('Failed to approve as government. Please try again.');
    }
  };

  const handleTransferRequest = async (tokenId: string) => {
    if (!contract || !transferAddress) {
      setError('Please enter a recipient address');
      return;
    }
    try {
      setError(null);
      const tx = await contract.requestTransfer(tokenId, transferAddress);
      await tx.wait();
      await fetchDocuments();
      setTransferAddress('');
      setSelectedTokenId('');
    } catch (error: any) {
      console.error('Error requesting transfer:', error);
      setError('Failed to request transfer: ' + error.message);
    }
  };

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

  if (!account) {
    return (
      <div className="text-center text-foreground/70 py-8">
        Please connect your wallet to view documents.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  if (documents.length === 0) {
    return (
      <div className="text-center text-foreground/70 py-8">
        {isGovernmentAccount(account) 
          ? 'No pending transfers requiring government approval.'
          : 'No documents found for your account.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {isGovernmentAccount(account) ? 'Government Document Review' : 'My Documents'}
          </h2>
          {isGovernmentAccount(account) && (
            <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs">
              Government View
            </span>
          )}
        </div>
        <p className="text-foreground/80">
          Connected Account: {truncateAddress(account)}
        </p>
      </div>
      
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div key={doc.tokenId} className="card">
            <div className="flex justify-between items-start p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">Document #{doc.tokenId}</span>
                  {doc.owner.toLowerCase() === account.toLowerCase() && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      Owner
                    </span>
                  )}
                  {isGovernmentAccount(account) && (
                    <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs">
                      Review Required
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-foreground">
                    IPFS Hash: 
                    <a 
                      href={getIpfsUrl(doc.ipfsHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:text-primary/80"
                    >
                      View Document
                    </a>
                  </p>
                  <p className="text-foreground/70">
                    Owner: {truncateAddress(doc.owner)}
                  </p>
                </div>

                {doc.owner.toLowerCase() === account.toLowerCase() && 
                 isEmptyAddress(doc.pendingOwner) && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      placeholder="Enter recipient address"
                      className="input w-full"
                      value={selectedTokenId === doc.tokenId ? transferAddress : ''}
                      onChange={(e) => {
                        setTransferAddress(e.target.value);
                        setSelectedTokenId(doc.tokenId);
                      }}
                    />
                    <button
                      onClick={() => handleTransferRequest(doc.tokenId)}
                      className="btn-primary w-full"
                    >
                      Request Transfer
                    </button>
                  </div>
                )}

                {!isEmptyAddress(doc.pendingOwner) && (
                  <div className="mt-4 p-4 bg-foreground/5 rounded-lg">
                    <p className="font-medium text-primary mb-2">
                      Transfer Pending to: {truncateAddress(doc.pendingOwner)}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          doc.ownerApproved ? 'bg-green-500' : 'bg-foreground/20'
                        }`} />
                        <span>Owner: {doc.ownerApproved ? 'Approved' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          doc.govtApproved ? 'bg-green-500' : 'bg-foreground/20'
                        }`} />
                        <span>Government: {doc.govtApproved ? 'Approved' : 'Pending'}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {/* Owner approval button */}
                      {doc.owner.toLowerCase() === account.toLowerCase() && 
                       !doc.ownerApproved && (
                        <button
                          onClick={() => handleApprove(doc.tokenId)}
                          className="btn-primary flex-1"
                        >
                          Approve as Owner
                        </button>
                      )}

                      {/* Government approval button */}
                      {isGovernmentAccount(account) && !doc.govtApproved && (
                        <button
                          onClick={() => handleGovtApprove(doc.tokenId)}
                          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex-1"
                        >
                          Approve as Government
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}