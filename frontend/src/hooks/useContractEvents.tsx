/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { truncateAddress } from '@/utils/address'; // We'll create this

export function useContractEvents(contract: any, fetchDocuments: () => Promise<void>) {
  useEffect(() => {
    if (!contract) return;

    
    const handleDocumentCreated = (tokenId: any, ipfsHash: string, owner: string) => {
      toast.success(
        <div>
          <p className="font-medium">Document created successfully</p>
          <p className="text-sm text-gray-500">
            Document #{tokenId.toString()}
            <br />
            Owner: {truncateAddress(owner)}
          </p>
        </div>
      );
      fetchDocuments();
    };

 
    const handleTransferRequested = (tokenId: any, from: string, to: string) => {
      toast(
        <div>
          <p className="font-medium">Transfer requested</p>
          <p className="text-sm text-gray-500">
            Document #{tokenId.toString()}
            <br />
            From: {truncateAddress(from)}
            <br />
            To: {truncateAddress(to)}
          </p>
        </div>,
        { icon: '📝' }
      );
      fetchDocuments();
    };

  
    const handleOwnerApproved = (tokenId: any, owner: string) => {
      toast.success(
        <div>
          <p className="font-medium">Owner approved transfer</p>
          <p className="text-sm text-gray-500">
            Document #{tokenId.toString()}
            <br />
            Owner: {truncateAddress(owner)}
          </p>
        </div>
      );
      fetchDocuments();
    };

  
    const handleGovtApproved = (tokenId: any, govt: string) => {
      toast.success(
        <div>
          <p className="font-medium">Government approved transfer</p>
          <p className="text-sm text-gray-500">
            Document #{tokenId.toString()}
          </p>
        </div>
      );
      fetchDocuments();
    };

   
    const handleTransferCompleted = (tokenId: any, from: string, to: string) => {
      toast.success(
        <div>
          <p className="font-medium">Transfer completed!</p>
          <p className="text-sm text-gray-500">
            Document #{tokenId.toString()}
            <br />
            From: {truncateAddress(from)}
            <br />
            To: {truncateAddress(to)}
          </p>
        </div>,
        { icon: '🎉', duration: 5000 }
      );
      fetchDocuments();
    };

  
    contract.on('DocumentCreated', handleDocumentCreated);
    contract.on('TransferRequested', handleTransferRequested);
    contract.on('OwnerApproved', handleOwnerApproved);
    contract.on('GovtApproved', handleGovtApproved);
    contract.on('TransferCompleted', handleTransferCompleted);

  
    return () => {
      contract.off('DocumentCreated', handleDocumentCreated);
      contract.off('TransferRequested', handleTransferRequested);
      contract.off('OwnerApproved', handleOwnerApproved);
      contract.off('GovtApproved', handleGovtApproved);
      contract.off('TransferCompleted', handleTransferCompleted);
    };
  }, [contract, fetchDocuments]);
}