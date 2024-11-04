// src/contexts/Web3Context.tsx
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import contractABI from '@/abi/GovChain.json';
import { usePersistentWallet } from '../hooks/usePerisistentWallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

type Document = {
  ipfsHash: string;
  owner: string;
  pendingOwner: string;
  ownerApproved: boolean;
  govtApproved: boolean;
}

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  contract: ethers.Contract | null;
  account: string | null;
  isAuthority: boolean;
  isGovt: boolean;
  connectWallet: () => Promise<void>;
  uploadToPinata: (file: File) => Promise<string>;
  getDocument?: (tokenId: number) => Promise<Document>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isAuthority, setIsAuthority] = useState(false);
  const [isGovt, setIsGovt] = useState(false);
  const { savedAddress, saveAddress, clearAddress } = usePersistentWallet();
 
  useEffect(() => {
    if (savedAddress && !account) {
      connectWallet();
    }
  }, [savedAddress]);
  const checkUserRole = (address: string) => {
    const authorityAddress = process.env.NEXT_PUBLIC_AUTHORITY_ADDRESS?.toLowerCase();
    const govtAddress = process.env.NEXT_PUBLIC_GOVT_ADDRESS?.toLowerCase();
    const userAddress = address.toLowerCase();

    setIsAuthority(userAddress === authorityAddress);
    setIsGovt(userAddress === govtAddress);
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check if we're on the right network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== process.env.NEXT_PUBLIC_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${Number(process.env.NEXT_PUBLIC_CHAIN_ID).toString(16)}` }],
            });
          } catch (error: any) {
            if (error.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${Number(process.env.NEXT_PUBLIC_CHAIN_ID).toString(16)}`,
                  chainName: 'Anvil Local',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [process.env.NEXT_PUBLIC_NETWORK_RPC],
                }],
              });
            }
          }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
          contractABI,
          signer
        );

        setProvider(provider);
        setContract(contract);
        setAccount(account);
        checkUserRole(account);
        saveAddress(account);

      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      console.error('MetaMask is not installed');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setContract(null);
    setAccount(null);
    clearAddress();
  };
  
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          saveAddress(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
      };
    }
  }, []);
  const uploadToPinata = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
          }
        }
      );

      return `ipfs://${response.data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkUserRole(accounts[0]);
        } else {
          setAccount(null);
          setProvider(null);
          setContract(null);
          setIsAuthority(false);
          setIsGovt(false);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      };
    }
  }, []);

  const value: Web3ContextType = {
    provider,
    contract,
    account,
    isAuthority,
    isGovt,
    connectWallet,
    uploadToPinata
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}