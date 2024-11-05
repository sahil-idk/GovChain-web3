/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent } from '@/components/ui/card';
import { UserCheck, ArrowRightLeft, RefreshCw, FileText, LucideIcon, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TransferRecord {
  tokenId: string;
  fromAddress: string;
  toAddress: string;
  ipfsHash: string;
  transferHash: string;
  blockNumber: number;
}

const TransferHistory = () => {
  const { contract, account, isGovt } = useWeb3();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const fetchTransferHistory = async () => {
    if (!contract || !account) return;

    try {
      setIsRefreshing(true);
      setError(null);

      // Get all TransferCompleted events
      const filter = contract.filters.TransferCompleted();
      const events = await contract.queryFilter(filter);

      // Process events and fetch additional document details
      const processedTransfers = await Promise.all(
        events.map(async (event) => {
          const tokenId = (event as any).args[0].toString();
          const from = (event as any).args[1];
          const to = (event as any).args[2];

          // Get document details for the IPFS hash
          const document = await contract.getDocument(tokenId);

          return {
            tokenId,
            fromAddress: from,
            toAddress: to,
            ipfsHash: document.ipfsHash,
            transferHash: event.transactionHash,
            blockNumber: event.blockNumber
          };
        })
      );

      // Filter transfers based on user role and involvement
      const filteredTransfers = processedTransfers.filter(transfer => {
        const currentAddress = account.toLowerCase();
        const fromAddress = transfer.fromAddress.toLowerCase();
        const toAddress = transfer.toAddress.toLowerCase();

        // Government can see all transfers
        if (isGovt) return true;

        // Users can only see transfers they're involved in
        return fromAddress === currentAddress || toAddress === currentAddress;
      });

      // Sort by block number (most recent first)
      const sortedTransfers = filteredTransfers.sort((a, b) => 
        b.blockNumber - a.blockNumber
      );

      setTransfers(sortedTransfers);
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      setError('Failed to fetch transfer history. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransferHistory();
  }, [contract, account]);

  // Listen for new transfers
  useEffect(() => {
    if (!contract) return;

    const handleTransferCompleted = async (tokenId: any, from: string, to: string) => {
      // Only refresh if the current user is involved or is government
      const isInvolved = 
        from.toLowerCase() === account?.toLowerCase() || 
        to.toLowerCase() === account?.toLowerCase() ||
        isGovt;

      if (isInvolved) {
        fetchTransferHistory();
      }
    };

    contract.on('TransferCompleted', handleTransferCompleted);

    return () => {
      contract.off('TransferCompleted', handleTransferCompleted);
    };
  }, [contract, account, isGovt]);

  
  const getTransferRole = (transfer: TransferRecord): { 
    icon: LucideIcon; 
    label: string; 
    textColor: string;
    bgColor: string;
  } => {
    const currentAddress = account?.toLowerCase();
    const fromAddress = transfer.fromAddress.toLowerCase();

    if (isGovt) {
      return {
        icon: ShieldCheck,
        label: 'Government View',
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10'
      };
    }
    if (fromAddress === currentAddress) {
      return {
        icon: ArrowRightLeft,
        label: 'Sent',
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10'
      };
    }
    return {
      icon: ArrowRightLeft,
      label: 'Received',
      textColor: 'text-green-500',
      bgColor: 'bg-green-500/10'
    };
  };


  if (!account) {
    return (
      <div className="text-center text-foreground/70 py-8">
        Please connect your wallet to view transfer history.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-foreground/70">Loading transfer history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Property Transfer History</h2>
          {isGovt && (
            <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs">
              Government View
            </span>
          )}
          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <LoadingSpinner size="small" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>
        <button
          onClick={fetchTransferHistory}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-primary hover:text-primary/80 disabled:text-foreground/50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid gap-4">
        {transfers.map((transfer) => {
          const roleInfo = getTransferRole(transfer);
          
          return (
            <Card key={transfer.transferHash} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-lg">Document #{transfer.tokenId}</span>
                    <span className={`px-2 py-1 rounded text-xs ${roleInfo.bgColor} ${roleInfo.textColor}`}>
                      <div className="flex items-center gap-1">
                        <roleInfo.icon className="w-3 h-3" />
                        {roleInfo.label}
                      </div>
                    </span>
                  </div>
                  <a
                    href={transfer.ipfsHash.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View Document
                  </a>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm bg-foreground/5 p-3 rounded-lg">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-zinc-400">Previous Owner:</span>
                        <div className="font-medium text-foreground">{truncateAddress(transfer.fromAddress)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm  bg-foreground/5 p-3 rounded-lg">
                      <ArrowRightLeft className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="text-zinc-400">New Owner:</span>
                        <div className="font-medium text-foreground">{truncateAddress(transfer.toAddress)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TransferHistory;