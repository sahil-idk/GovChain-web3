// src/components/DocumentUpload.tsx
'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from 'ethers';

export default function DocumentUpload() {
  const { contract, account, uploadToPinata } = useWeb3();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !contract || !account) return;

    try {
      setUploading(true);
      setError(null);
      setStatus('Uploading to IPFS...');
      
      // Upload to IPFS via Pinata
      const ipfsHash = await uploadToPinata(file);
      
      setStatus('Preparing transaction...');
      
      // Get signer's network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('Current network:', network);

      // Get signer's balance
      const balance = await provider.getBalance(account);
      console.log('Account balance:', ethers.formatEther(balance));

      // Estimate gas with a higher limit
      setStatus('Estimating gas...');
      const gasEstimate = await contract.uploadDocument.estimateGas(ipfsHash);
      console.log('Estimated gas:', gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);
      
      setStatus('Creating transaction...');
      const tx = await contract.uploadDocument(ipfsHash, {
        from: account,
        gasLimit: gasLimit,
      });
      
      setStatus('Waiting for confirmation...');
      console.log('Transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      setStatus('Document uploaded successfully!');
      setFile(null);
    } catch (error: any) {
      console.error('Upload error details:', error);
      let errorMessage = 'Error uploading document. ';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage += 'Transaction was rejected by user.';
      } else if (error.code === -32603) {
        errorMessage += 'Please verify you have enough ETH and are connected to the correct network.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  const verifyNetwork = async () => {
    if (window.ethereum) {
      try {
        // Request network switch
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
      } catch (switchError: any) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7A69',
                chainName: 'Anvil Local',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              }],
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
          }
        }
      }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Select Document
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded"
            disabled={uploading}
          />
        </div>

        <button
          type="button"
          onClick={verifyNetwork}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 mb-2"
        >
          Verify Network Connection
        </button>

        <button
          type="submit"
          disabled={!file || uploading || !account}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>

        {status && (
          <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {account && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Connected Account: {account}
          </p>
        )}
      </form>
    </div>
  );
}