// src/components/PropertyRegistration.tsx
'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from 'ethers';

interface PropertyFormData {
  propertyType: string;
  location: string;
  area: string;
  value: string;
  description: string;
}

export default function PropertyRegistration() {
  const { contract, account } = useWeb3();
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyType: '',
    location: '',
    area: '',
    value: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !account) return;

    try {
      setRegistering(true);
      setError(null);
      setStatus('Preparing transaction...');
      
      // Convert string values to appropriate types
      const areaInSqFt = ethers.parseUnits(formData.area, 0); // Convert to BigNumber
      const propertyValue = ethers.parseUnits(formData.value, 0); // Convert to BigNumber
      
      // Get signer's network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('Current network:', network);

      // Estimate gas
      setStatus('Estimating gas...');
      const gasEstimate = await contract.registerProperty.estimateGas(
        formData.propertyType,
        formData.location,
        areaInSqFt,
        propertyValue,
        formData.description
      );
      
      // Add 20% buffer to gas estimate
      const gasLimit = Math.ceil(Number(gasEstimate) * 1.2);
      
      setStatus('Creating transaction...');
      const tx = await contract.registerProperty(
        formData.propertyType,
        formData.location,
        areaInSqFt,
        propertyValue,
        formData.description,
        {
          from: account,
          gasLimit: gasLimit,
        }
      );
      
      setStatus('Waiting for confirmation...');
      console.log('Transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      setStatus('Property registered successfully!');
      
      // Reset form after successful registration
      setFormData({
        propertyType: '',
        location: '',
        area: '',
        value: '',
        description: ''
      });
    } catch (error: any) {
      console.error('Registration error details:', error);
      let errorMessage = 'Error registering property. ';
      
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
      setRegistering(false);
    }
  };

  const verifyNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
      } catch (switchError: any) {
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
      <form onSubmit={handleRegistration} className="space-y-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Property Type
          </label>
          <input
            type="text"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleInputChange}
            placeholder="e.g., Residential, Commercial"
            className="w-full p-2 border rounded"
            disabled={registering}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Property address"
            className="w-full p-2 border rounded"
            disabled={registering}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Area (in sq ft)
          </label>
          <input
            type="number"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            placeholder="Area in square feet"
            className="w-full p-2 border rounded"
            disabled={registering}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Value (in ETH)
          </label>
          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleInputChange}
            placeholder="Property value"
            className="w-full p-2 border rounded"
            disabled={registering}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Property description"
            className="w-full p-2 border rounded"
            disabled={registering}
            rows={4}
            required
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
          disabled={registering || !account}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {registering ? 'Registering...' : 'Register Property'}
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