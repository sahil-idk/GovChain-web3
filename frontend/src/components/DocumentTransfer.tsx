'use client';

import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

export default function DocumentTransfer() {
  const { contract } = useWeb3();
  const [tokenId, setTokenId] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !tokenId || !newOwner) return;

    try {
      setLoading(true);
      setStatus('Creating transfer request...');
      
      const tx = await contract.requestTransfer(tokenId, newOwner);
      setStatus('Waiting for transaction confirmation...');
      await tx.wait();
      
      setStatus('Transfer request submitted successfully!');
      setTokenId('');
      setNewOwner('');
    } catch (error) {
      console.error('Error requesting transfer:', error);
      setStatus('Error requesting transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleTransfer}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Token ID
          </label>
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter token ID"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            New Owner Address
          </label>
          <input
            type="text"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter new owner's address"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !tokenId || !newOwner}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Request Transfer'}
        </button>
        {status && (
          <p className="mt-4 text-center text-sm text-gray-600">{status}</p>
        )}
      </form>
    </div>
  );
}