/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import contractABI from '@/abi/GovChain.json';
import { usePersistentWallet } from '../hooks/usePerisistentWallet';
import toast from 'react-hot-toast'
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
  isGovt: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;  
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
  const [isGovt, setIsGovt] = useState(false);
  const { savedAddress, saveAddress, clearAddress } = usePersistentWallet();
 
  useEffect(() => {
    if (savedAddress && !account) {
      connectWallet();
    }
  }, [savedAddress]);
  const checkUserRole = (address: string) => {

    const govtAddress = process.env.NEXT_PUBLIC_GOVT_ADDRESS?.toLowerCase();
    const userAddress = address.toLowerCase();

    setIsGovt(userAddress === govtAddress);
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Check if MetaMask is installed and unlocked
        const isUnlocked = await window.ethereum._metamask?.isUnlocked();
        if (!isUnlocked) {
          toast.error(
            <div>
              <p className="font-medium">MetaMask is locked</p>
              <p className="text-sm">Please unlock your MetaMask wallet to continue</p>
            </div>
          );
          return;
        }

        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== process.env.NEXT_PUBLIC_CHAIN_ID) {
          toast.loading('Switching to correct network...', { id: 'network-switch' });
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${Number(process.env.NEXT_PUBLIC_CHAIN_ID).toString(16)}` }],
            });
            toast.success('Network switched successfully', { id: 'network-switch' });
          } catch (error: any) {
            if (error.code === 4902) {
              try {
                toast.loading('Adding Anvil network...', { id: 'network-add' });
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${Number(process.env.NEXT_PUBLIC_CHAIN_ID).toString(16)}`,
                    chainName: 'Anvil Local',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [process.env.NEXT_PUBLIC_NETWORK_RPC],
                  }],
                });
                toast.success('Network added successfully', { id: 'network-add' });
              } catch (addError: any) {
                toast.error(
                  <div>
                    <p className="font-medium">Failed to add network</p>
                    <p className="text-sm">Please add Anvil network manually to MetaMask</p>
                  </div>,
                  { id: 'network-add' }
                );
                return;
              }
            } else {
              toast.error(
                <div>
                  <p className="font-medium">Network switch failed</p>
                  <p className="text-sm">Please switch to Anvil network manually</p>
                </div>
              );
              return;
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

        toast.success(
          <div>
            <p className="font-medium">Connected successfully</p>
            <p className="text-sm">Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>
        );

      } catch (error: any) {
        console.error('Error connecting wallet:', error);
        
        // Handle specific error cases
        if (error.code === 4001) {
          toast.error(
            <div>
              <p className="font-medium">Connection rejected</p>
              <p className="text-sm">Please approve the connection request in MetaMask</p>
            </div>
          );
        } else if (error.code === -32002) {
          toast.error(
            <div>
              <p className="font-medium">Connection pending</p>
              <p className="text-sm">Please check MetaMask for a pending connection request</p>
            </div>
          );
        } else if (error.message?.includes('already processing')) {
          toast.error(
            <div>
              <p className="font-medium">Request in progress</p>
              <p className="text-sm">Please complete the pending MetaMask request</p>
            </div>
          );
        } else {
          toast.error(
            <div>
              <p className="font-medium">Connection failed</p>
              <p className="text-sm">Please try again or refresh the page</p>
            </div>
          );
        }
      }
    } else {
      toast.error(
        <div>
          <p className="font-medium">MetaMask not found</p>
          <p className="text-sm">Please install MetaMask to use this application</p>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 text-sm mt-1 block"
          >
            Download MetaMask
          </a>
        </div>,
        { duration: 6000 }
      );
    }
  };


  const disconnectWallet = () => {
    setProvider(null);
    setContract(null);
    setAccount(null);
    clearAddress();
    toast.success('Wallet disconnected successfully');
  };
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          saveAddress(accounts[0]);
          checkUserRole(accounts[0]);
          toast.success(
            <div>
              <p className="font-medium">Account switched</p>
              <p className="text-sm">New account: {accounts[0].slice(0, 6)}...{accounts[0].slice(-4)}</p>
            </div>
          );
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        toast.loading('Network changed, refreshing...', 
          { id: 'chain-change', duration: 1000 }
        );
        setTimeout(() => window.location.reload(), 1000);
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
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
    isGovt,
    connectWallet,
    disconnectWallet,
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