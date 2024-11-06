import { useState, useEffect } from 'react';

export function usePersistentWallet() {
  const [savedAddress, setSavedAddress] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('walletAddress');
    if (saved) setSavedAddress(saved);
  }, []);

  const saveAddress = (address: string) => {
    localStorage.setItem('walletAddress', address);
    setSavedAddress(address);
  };

  const clearAddress = () => {
    localStorage.removeItem('walletAddress');
    setSavedAddress(null);
  };

  return { savedAddress, saveAddress, clearAddress };
}