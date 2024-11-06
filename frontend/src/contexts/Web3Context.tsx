'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import contractABI from '@/abi/GovChain.json';
import { usePersistentWallet } from '../hooks/usePerisistentWallet';
import toast from 'react-hot-toast';

// Network configuration
const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

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

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: SEPOLIA_CONFIG.chainId,
              chainName: SEPOLIA_CONFIG.chainName,
              nativeCurrency: SEPOLIA_CONFIG.nativeCurrency,
              rpcUrls: SEPOLIA_CONFIG.rpcUrls,
              blockExplorerUrls: SEPOLIA_CONFIG.blockExplorerUrls
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding Sepolia:', addError);
          toast.error('Failed to add Sepolia network');
          return false;
        }
      }
      console.error('Error switching to Sepolia:', switchError);
      toast.error('Failed to switch to Sepolia network');
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
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
      return;
    }

    try {
      // Request accounts without checking lock status
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found. Please unlock MetaMask and try again.');
        return;
      }

      // Check and switch network if needed
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      if (chainId !== SEPOLIA_CONFIG.chainId) {
        toast.loading('Switching to Sepolia network...', { id: 'network-switch' });
        const switched = await switchToSepolia();
        if (!switched) {
          toast.error('Failed to switch to Sepolia network', { id: 'network-switch' });
          return;
        }
        toast.success('Switched to Sepolia network', { id: 'network-switch' });
      }

      // Initialize provider and contract
      try {
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
      } catch (error) {
        console.error('Error initializing contract:', error);
        toast.error('Failed to initialize connection. Please try again.');
        return;
      }

    } catch (error: any) {
      console.error('Connection error:', error);
      
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.code === -32002) {
        toast.error('Please check MetaMask for pending connection');
      } else {
        toast.error('Failed to connect. Please try again.');
      }
    }
  };

  // Rest of your code remains the same...
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