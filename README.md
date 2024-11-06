# GovChain

GovChain is a blockchain-based document verification and management system built with Next.js 14 and Ethereum smart contracts. The platform enables secure, transparent, and decentralized document management for government institutions and citizens.

## Repository Structure

```
GovChain-web3/
├── frontend/             # Next.js 14 frontend application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── public/          # Static assets
│   ├── styles/         # CSS styles
│   └── utils/          # Utility functions
│
├── GovChainContract/    # Smart contract files
│   ├── src/            # Contract source files
│   ├── script/         # Deployment scripts
│   └── test/           # Contract tests
```

## Prerequisites

Before you begin, ensure you have the following installed:
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
# or
yarn install
```

3. Set up environment variables:
   - Create a `.env.local` file in the frontend directory
   - Copy the appropriate environment configuration (see Environment Setup section)
   - Update values as needed

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

### Smart Contract Local Development Setup (Optional)

1. Navigate to the contract directory:
```bash
cd GovChainContract
```

2. Install Foundry dependencies:
```bash
forge install
```

3. Build contracts:
```bash
forge build
```

## Environment Setup

### Production/Sepolia Configuration
Create a `.env.local` file in the `frontend` directory with the following configuration:

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
For local development using Foundry's Anvil, use this configuration in the `frontend/.env.local` file:

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

2. In a new terminal, deploy contracts:
```bash
cd GovChainContract
forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast
```

3. Update your `frontend/.env.local` with the new contract address from deployment

4. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```


## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Support

For support, please open an issue in the [GitHub repository](https://github.com/sahil-idk/GovChain-web3) or contact the maintainers.
