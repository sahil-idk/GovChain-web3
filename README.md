# GovChain

GovChain is a blockchain-based document verification and management system built with Next.js 14 and Ethereum smart contracts. The platform provides a secure and transparent solution for government document management through decentralized storage and multi-signature verification.

## Key Features

- **Secure Document Management**: IPFS-based storage with blockchain verification
- **Multi-Signature Verification**: Dual confirmation system (citizen and government)
- **Access Control**: Role-based permissions through smart contracts
- **Transparent Tracking**: On-chain verification status and complete audit trail
- **Decentralized Storage**: IPFS integration with unique Content Identifiers (CID)

## Repository Structure

```
GovChain-web3/
├── frontend/             # Next.js 14 frontend application
├── GovChainContract/    # Smart contract files
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Foundry (for local development)
- Git
- MetaMask wallet

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sahil-idk/GovChain-web3.git
cd GovChain-web3
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the frontend directory
   - Copy the appropriate environment configuration
   - Update values as needed

4. Start the development server:
```bash
npm run dev
```

### Smart Contract Local Development Setup (Optional)

1. Navigate to the contract directory:
```bash
cd GovChainContract
```

2. Install Foundry dependencies:
```bash
forge install
forge build
```

## Environment Setup

### Production/Sepolia Configuration
Create a `.env.local` file in the `frontend` directory:

```plaintext
# Contract Details
NEXT_PUBLIC_GOVT_ADDRESS=0x6F9F2D5191717cF1B1a2a52E534914ED5950427a

# Pinata Credentials
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# Network Details
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x89295696588DcbB3C40cf8f10af2398Fdf7585FA
NEXT_PUBLIC_NETWORK=sepolia
```

### Local Development Configuration (Optional)
For local development using Foundry's Anvil:

```plaintext
# Contract Details
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_GOVT_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Pinata Credentials
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# Network Configuration
NEXT_PUBLIC_NETWORK_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=31337
```

## Using the Application

### With MetaMask (Recommended)
1. Install MetaMask browser extension
2. Connect to Sepolia testnet
3. Use the application with the production environment configuration
4. Ensure you have some Sepolia ETH for transactions

### Local Development (Optional)
1. Start local Anvil chain:
```bash
cd GovChainContract
anvil
```

2. Deploy contracts:
```bash
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

3. Start the frontend:
```bash
cd frontend
npm run dev
```



## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License

## Support

For support, please open an issue in the [GitHub repository](https://github.com/sahil-idk/GovChain-web3) or contact the maintainers.
