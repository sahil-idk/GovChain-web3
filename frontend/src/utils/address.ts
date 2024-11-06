
export const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  export const isEmptyAddress = (address: string) => {
    return address === '0x0000000000000000000000000000000000000000';
  };
  
  export const isGovernmentAccount = (address: string | null, govtAddress: string) => {
    if (!address) return false;
    return address.toLowerCase() === govtAddress.toLowerCase();
  };