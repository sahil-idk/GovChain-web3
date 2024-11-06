// constants/networks.ts
export const NETWORKS = {
    sepolia: {
      chainId: '0xaa36a7', // 11155111 in hex
      chainName: 'Sepolia',
      nativeCurrency: {
        name: 'SepoliaETH',
        symbol: 'ETH',
        decimals: 18
      },
      rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}'],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    }
  }
  
  export const CONTRACT_ADDRESS = '0x89295696588DcbB3C40cf8f10af2398Fdf7585FA'  