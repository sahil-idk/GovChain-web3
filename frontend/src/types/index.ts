export interface TransactionHistory {
    tokenId: string;
    type: 'created' | 'requested' | 'ownerApproved' | 'govtApproved' | 'completed';
    timestamp: number;
    from?: string;
    to?: string;
    hash: string;
  }
  
  export interface Document {
    tokenId: string;
    ipfsHash: string;
    owner: string;
    pendingOwner: string;
    ownerApproved: boolean;
    govtApproved: boolean;
    transactions?: TransactionHistory[];
  }